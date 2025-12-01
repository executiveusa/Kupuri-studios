"""
Agent Studio CRUD Router
Handles saving, loading, deploying, and managing AI agents.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os
from datetime import datetime
from pathlib import Path

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Pydantic Models
class NodeData(BaseModel):
    """Represents a single node in the agent graph"""
    id: str
    type: str
    position: dict
    data: dict


class EdgeData(BaseModel):
    """Represents a connection between nodes"""
    id: str
    source: str
    target: str


class AgentData(BaseModel):
    """Represents a complete agent configuration"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    systemPrompt: str = Field(default="", max_length=5000)
    nodes: List[NodeData] = Field(default=[])
    edges: List[EdgeData] = Field(default=[])


class AgentResponse(BaseModel):
    """Response model for agent operations"""
    id: str
    name: str
    description: str
    systemPrompt: str
    nodes: List[NodeData]
    edges: List[EdgeData]
    createdAt: str
    updatedAt: str
    deployed: bool


class AgentListResponse(BaseModel):
    """Response for paginated agent list"""
    agents: List[AgentResponse]
    total: int
    page: int
    limit: int
    hasMore: bool


# In-memory storage (replace with database in production)
_AGENTS_STORAGE = {}
_STORAGE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "agents.json")


def _ensure_storage_dir():
    """Ensure the storage directory exists"""
    os.makedirs(os.path.dirname(_STORAGE_FILE), exist_ok=True)


def _load_agents_from_disk():
    """Load all agents from disk"""
    global _AGENTS_STORAGE
    _ensure_storage_dir()
    if os.path.exists(_STORAGE_FILE):
        try:
            with open(_STORAGE_FILE, 'r') as f:
                _AGENTS_STORAGE = json.load(f)
                print(f"✅ Loaded {len(_AGENTS_STORAGE)} agents from disk")
        except Exception as e:
            print(f"⚠️  Failed to load agents from disk: {e}")
            _AGENTS_STORAGE = {}
    else:
        _AGENTS_STORAGE = {}


def _save_agents_to_disk():
    """Save all agents to disk"""
    _ensure_storage_dir()
    try:
        with open(_STORAGE_FILE, 'w') as f:
            json.dump(_AGENTS_STORAGE, f, indent=2)
            print(f"💾 Saved {len(_AGENTS_STORAGE)} agents to disk")
    except Exception as e:
        print(f"❌ Failed to save agents to disk: {e}")
        raise HTTPException(status_code=500, detail="Failed to save agent")


def _generate_agent_id():
    """Generate a unique agent ID"""
    import uuid
    return str(uuid.uuid4())


def _format_agent_response(agent_id: str, agent_data: dict, deployed: bool = False) -> AgentResponse:
    """Format an agent for API response"""
    return AgentResponse(
        id=agent_id,
        name=agent_data.get("name", ""),
        description=agent_data.get("description", ""),
        systemPrompt=agent_data.get("systemPrompt", ""),
        nodes=[NodeData(**node) for node in agent_data.get("nodes", [])],
        edges=[EdgeData(**edge) for edge in agent_data.get("edges", [])],
        createdAt=agent_data.get("createdAt", datetime.now().isoformat()),
        updatedAt=agent_data.get("updatedAt", datetime.now().isoformat()),
        deployed=deployed,
    )


@router.on_event("startup")
async def startup():
    """Load agents from disk on startup"""
    _load_agents_from_disk()


@router.post("/", response_model=AgentResponse, status_code=201)
async def save_agent(agent: AgentData):
    """
    Create a new agent or update existing one.
    
    - **name**: Agent name (required, 1-100 chars)
    - **description**: Agent description (optional, max 500 chars)
    - **systemPrompt**: System instructions for the agent (optional, max 5000 chars)
    - **nodes**: Graph nodes (optional)
    - **edges**: Graph edges (optional)
    
    Returns: Created/updated agent with ID and metadata
    """
    try:
        agent_id = _generate_agent_id()
        now = datetime.now().isoformat()
        
        agent_record = {
            "name": agent.name,
            "description": agent.description,
            "systemPrompt": agent.systemPrompt,
            "nodes": [node.dict() for node in agent.nodes],
            "edges": [edge.dict() for edge in agent.edges],
            "createdAt": now,
            "updatedAt": now,
        }
        
        _AGENTS_STORAGE[agent_id] = agent_record
        _save_agents_to_disk()
        
        print(f"🚀 Created agent: {agent_id} ({agent.name})")
        return _format_agent_response(agent_id, agent_record)
    except Exception as e:
        print(f"❌ Failed to save agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}", response_model=AgentResponse)
async def load_agent(agent_id: str):
    """
    Load a specific agent by ID.
    
    - **agent_id**: The unique agent identifier
    
    Returns: Agent configuration and metadata
    """
    if agent_id not in _AGENTS_STORAGE:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    agent_data = _AGENTS_STORAGE[agent_id]
    print(f"📖 Loaded agent: {agent_id}")
    return _format_agent_response(agent_id, agent_data)


@router.get("/", response_model=AgentListResponse)
async def list_agents(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    """
    List all agents with pagination.
    
    - **page**: Page number (default 1)
    - **limit**: Items per page (default 20, max 100)
    
    Returns: Paginated list of agents
    """
    try:
        total = len(_AGENTS_STORAGE)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        agent_ids = sorted(_AGENTS_STORAGE.keys())
        paginated_ids = agent_ids[start_idx:end_idx]
        
        agents = [
            _format_agent_response(agent_id, _AGENTS_STORAGE[agent_id])
            for agent_id in paginated_ids
        ]
        
        has_more = end_idx < total
        
        print(f"📋 Listed agents: page {page}, {len(agents)} items, total {total}")
        return AgentListResponse(
            agents=agents,
            total=total,
            page=page,
            limit=limit,
            hasMore=has_more,
        )
    except Exception as e:
        print(f"❌ Failed to list agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, agent: AgentData):
    """
    Update an existing agent.
    
    - **agent_id**: The unique agent identifier
    - **agent**: Updated agent configuration
    
    Returns: Updated agent with new metadata
    """
    if agent_id not in _AGENTS_STORAGE:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    try:
        now = datetime.now().isoformat()
        original = _AGENTS_STORAGE[agent_id]
        
        updated_record = {
            "name": agent.name,
            "description": agent.description,
            "systemPrompt": agent.systemPrompt,
            "nodes": [node.dict() for node in agent.nodes],
            "edges": [edge.dict() for edge in agent.edges],
            "createdAt": original.get("createdAt", now),
            "updatedAt": now,
        }
        
        _AGENTS_STORAGE[agent_id] = updated_record
        _save_agents_to_disk()
        
        print(f"✏️  Updated agent: {agent_id}")
        return _format_agent_response(agent_id, updated_record)
    except Exception as e:
        print(f"❌ Failed to update agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str):
    """
    Delete an agent by ID.
    
    - **agent_id**: The unique agent identifier
    
    Returns: No content on success
    """
    if agent_id not in _AGENTS_STORAGE:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    try:
        del _AGENTS_STORAGE[agent_id]
        _save_agents_to_disk()
        
        print(f"🗑️  Deleted agent: {agent_id}")
    except Exception as e:
        print(f"❌ Failed to delete agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{agent_id}/deploy", response_model=dict)
async def deploy_agent(agent_id: str):
    """
    Deploy an agent (mark as active).
    
    - **agent_id**: The unique agent identifier
    
    Returns: Status message and deployment timestamp
    """
    if agent_id not in _AGENTS_STORAGE:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    try:
        agent_data = _AGENTS_STORAGE[agent_id]
        now = datetime.now().isoformat()
        
        # Mark agent as deployed
        agent_data["deployedAt"] = now
        agent_data["updatedAt"] = now
        
        _save_agents_to_disk()
        
        print(f"🚀 Deployed agent: {agent_id} ({agent_data.get('name', 'unknown')})")
        return {
            "status": "deployed",
            "agentId": agent_id,
            "deployedAt": now,
            "agentName": agent_data.get("name", ""),
        }
    except Exception as e:
        print(f"❌ Failed to deploy agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))
