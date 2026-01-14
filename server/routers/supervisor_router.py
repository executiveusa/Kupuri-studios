"""
Kupuri Studios - Agent Supervisor WebSocket Router
==================================================
Real-time monitoring of the Lightning Orchestrator and all sub-agents.
Provides live updates on relay races, gate validations, and agent status.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import asyncio
import json
import logging
from datetime import datetime

from services.lightning_orchestrator import lightning_orchestrator, RelayRace

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/supervisor", tags=["supervisor"])


class ConnectionManager:
    """Manages WebSocket connections for supervisor dashboard"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Supervisor client connected. Total: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Supervisor client disconnected. Total: {len(self.active_connections)}")
        
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message: {e}")
                disconnected.append(connection)
                
        # Clean up disconnected
        for conn in disconnected:
            try:
                self.active_connections.remove(conn)
            except:
                pass


manager = ConnectionManager()


# Register the broadcast callback with the orchestrator
async def orchestrator_broadcast(event: Dict[str, Any]):
    """Callback for orchestrator events"""
    await manager.broadcast(event)

lightning_orchestrator.register_websocket_callback(orchestrator_broadcast)


@router.websocket("/ws")
async def supervisor_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time supervisor monitoring.
    
    Sends events:
    - relay_started: When a new relay race begins
    - agent_started: When an agent begins execution
    - agent_completed: When an agent finishes
    - gate_completed: When a validation gate completes
    - relay_completed: When a relay race finishes
    - status_update: Periodic status updates
    """
    await manager.connect(websocket)
    
    # Send initial status
    await websocket.send_json({
        "type": "connected",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Connected to Kupuri Studios Supervisor",
        "agents": lightning_orchestrator.get_all_agents_status(),
        "active_races": len(lightning_orchestrator.active_races)
    })
    
    try:
        while True:
            # Wait for client messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle client commands
            if message.get("type") == "start_race":
                # Start a new relay race
                race = await lightning_orchestrator.start_relay_race(
                    name=message.get("name", "Unnamed Race"),
                    authorization=message.get("authorization", {"option": "A"}),
                    tasks=message.get("tasks", [])
                )
                await websocket.send_json({
                    "type": "race_created",
                    "race_id": race.id,
                    "status": race.status
                })
                
            elif message.get("type") == "get_status":
                # Get current status
                await websocket.send_json({
                    "type": "status_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "agents": lightning_orchestrator.get_all_agents_status(),
                    "active_races": [
                        lightning_orchestrator.get_race_status(rid)
                        for rid in lightning_orchestrator.active_races.keys()
                    ]
                })
                
            elif message.get("type") == "get_race":
                # Get specific race status
                race_id = message.get("race_id")
                status = lightning_orchestrator.get_race_status(race_id)
                await websocket.send_json({
                    "type": "race_status",
                    "race": status
                })
                
            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.get("/status")
async def get_supervisor_status():
    """Get current supervisor and agent status"""
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "orchestrator": "Lightning Orchestrator v1.0",
        "agents": lightning_orchestrator.get_all_agents_status(),
        "active_races": len(lightning_orchestrator.active_races),
        "completed_races": len(lightning_orchestrator.completed_races),
        "connected_clients": len(manager.active_connections)
    }


@router.get("/agents")
async def get_agents():
    """Get all agent statuses"""
    return {
        "agents": lightning_orchestrator.get_all_agents_status()
    }


@router.get("/races")
async def get_races():
    """Get all relay races (active and completed)"""
    active = [
        lightning_orchestrator.get_race_status(rid)
        for rid in lightning_orchestrator.active_races.keys()
    ]
    
    completed = [
        lightning_orchestrator.get_race_status(race.id)
        for race in lightning_orchestrator.completed_races[-10:]  # Last 10
    ]
    
    return {
        "active": active,
        "completed": completed
    }


@router.get("/races/{race_id}")
async def get_race(race_id: str):
    """Get specific relay race status"""
    status = lightning_orchestrator.get_race_status(race_id)
    if not status:
        return {"error": "Race not found"}
    return status


@router.post("/races")
async def start_race(
    name: str = "Video Generation",
    option: str = "A",
    tasks: List[str] = []
):
    """
    Start a new relay race.
    
    Options:
    - A: Full autonomous execution
    - B: Human-in-loop at gates
    - C: Read-only mode
    - D: Custom scope
    """
    race = await lightning_orchestrator.start_relay_race(
        name=name,
        authorization={
            "option": option,
            "authorized_tasks": tasks if tasks else [
                "transcribe_audio",
                "generate_script",
                "create_video",
                "process_payment"
            ]
        },
        tasks=tasks if tasks else [
            "transcribe_audio",
            "generate_script", 
            "create_video",
            "process_payment"
        ]
    )
    
    return {
        "race_id": race.id,
        "name": race.name,
        "status": race.status,
        "started_at": race.started_at.isoformat() if race.started_at else None
    }
