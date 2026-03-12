"""
Chatwoot API Router - REST and WebSocket endpoints for Chatwoot integration.

This module provides FastAPI routes that proxy to the Chatwoot API,
as well as WebSocket endpoints for real-time updates and webhook
endpoints for receiving Chatwoot events.

Endpoints:
- GET /api/chatwoot/conversations - List conversations
- GET /api/chatwoot/conversations/{id} - Get conversation details
- POST /api/chatwoot/conversations/{id}/messages - Send message
- GET /api/chatwoot/contacts - List contacts
- GET /api/chatwoot/agents - List agents
- POST /api/chatwoot/conversations/{id}/assignments - Assign conversation
- GET /api/chatwoot/reports/summary - Get report summary
- WebSocket /api/chatwoot/ws - Real-time updates
- POST /api/chatwoot/webhook - Chatwoot webhook receiver
"""

import asyncio
import hashlib
import hmac
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Header,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from models.chatwoot_models import (
    Contact,
    ContactCreate,
    ContactUpdate,
    Conversation,
    ConversationAssignment,
    ConversationCreate,
    ConversationStatus,
    ConversationUpdate,
    Message,
    MessageCreate,
    PaginatedContacts,
    PaginatedConversations,
    PaginatedMessages,
    ReportSummary,
    WebhookEventType,
    WebhookPayload,
)
from services.chatwoot_service import (
    ChatwootAuthenticationError,
    ChatwootClient,
    ChatwootConnectionError,
    ChatwootError,
    ChatwootNotFoundError,
    ChatwootRateLimitError,
    ChatwootValidationError,
    chatwoot_client,
)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create router with prefix
router = APIRouter(prefix="/api/chatwoot", tags=["chatwoot"])


# ============================================================================
# Dependencies
# ============================================================================

async def get_client() -> ChatwootClient:
    """
    Dependency to get the Chatwoot client.
    Validates that the client is properly configured.
    """
    if not chatwoot_client.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chatwoot integration is not configured. Please set CHATWOOT_URL, CHATWOOT_API_KEY, and CHATWOOT_ACCOUNT_ID environment variables.",
        )
    return chatwoot_client


def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str,
) -> bool:
    """
    Verify Chatwoot webhook signature.

    Args:
        payload: Raw request body
        signature: X-Chatwoot-Signature header value
        secret: Webhook secret

    Returns:
        True if signature is valid
    """
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)


# ============================================================================
# Exception Handlers
# ============================================================================

def handle_chatwoot_error(error: ChatwootError) -> HTTPException:
    """Convert Chatwoot errors to HTTP exceptions."""
    if isinstance(error, ChatwootAuthenticationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error.message,
        )
    elif isinstance(error, ChatwootNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error.message,
        )
    elif isinstance(error, ChatwootValidationError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error.message,
        )
    elif isinstance(error, ChatwootRateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=error.message,
            headers={"Retry-After": str(error.retry_after or 60)},
        )
    elif isinstance(error, ChatwootConnectionError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to Chatwoot: {error.message}",
        )
    else:
        return HTTPException(
            status_code=error.status_code or status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error.message,
        )


# ============================================================================
# Request/Response Models
# ============================================================================

class SendMessageRequest(BaseModel):
    """Request body for sending a message."""
    content: str
    message_type: str = "outgoing"
    private: bool = False
    content_type: str = "text"
    content_attributes: Optional[Dict[str, Any]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    echo_id: Optional[str] = None


class AssignConversationRequest(BaseModel):
    """Request body for assigning a conversation."""
    assignee_id: Optional[int] = None
    team_id: Optional[int] = None


class UpdateConversationRequest(BaseModel):
    """Request body for updating a conversation."""
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    team_id: Optional[int] = None
    labels: Optional[List[str]] = None
    priority: Optional[str] = None
    snoozed_until: Optional[int] = None


class CreateContactRequest(BaseModel):
    """Request body for creating a contact."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    identifier: Optional[str] = None
    avatar_url: Optional[str] = None
    custom_attributes: Optional[Dict[str, Any]] = None


class CreateConversationRequest(BaseModel):
    """Request body for creating a conversation."""
    source_id: str
    inbox_id: int
    contact_id: Optional[int] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    team_id: Optional[int] = None
    additional_attributes: Optional[Dict[str, Any]] = None
    custom_attributes: Optional[Dict[str, Any]] = None


class ToggleStatusRequest(BaseModel):
    """Request body for toggling conversation status."""
    status: str


class AddLabelsRequest(BaseModel):
    """Request body for adding labels."""
    labels: List[str]


class CreateLabelRequest(BaseModel):
    """Request body for creating a label."""
    title: str
    description: Optional[str] = None
    color: Optional[str] = None
    show_on_sidebar: bool = True


class ChatwootHealthResponse(BaseModel):
    """Health check response."""
    status: str
    configured: bool
    base_url: Optional[str] = None
    account_id: Optional[int] = None


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@router.get("/health", response_model=ChatwootHealthResponse)
async def health_check() -> ChatwootHealthResponse:
    """
    Check Chatwoot integration health status.

    Returns:
        Health status and configuration info
    """
    return ChatwootHealthResponse(
        status="healthy" if chatwoot_client.is_configured else "unconfigured",
        configured=chatwoot_client.is_configured,
        base_url=chatwoot_client.config.base_url if chatwoot_client.is_configured else None,
        account_id=chatwoot_client.config.account_id if chatwoot_client.is_configured else None,
    )


# ============================================================================
# Conversation Endpoints
# ============================================================================

@router.get("/conversations")
async def list_conversations(
    status: Optional[str] = Query(None, description="Filter by status"),
    assignee_type: Optional[str] = Query(None, description="Filter by assignee type"),
    inbox_id: Optional[int] = Query(None, description="Filter by inbox ID"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    labels: Optional[str] = Query(None, description="Comma-separated labels"),
    page: int = Query(1, ge=1, description="Page number"),
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    List conversations with optional filters.

    - **status**: open, resolved, pending, snoozed
    - **assignee_type**: me, unassigned, all
    - **inbox_id**: Filter by specific inbox
    - **team_id**: Filter by specific team
    - **labels**: Comma-separated label names
    - **page**: Page number for pagination
    """
    try:
        conv_status = ConversationStatus(status) if status else None
        label_list = labels.split(",") if labels else None

        result = await client.list_conversations(
            status=conv_status,
            assignee_type=assignee_type,
            inbox_id=inbox_id,
            team_id=team_id,
            labels=label_list,
            page=page,
        )

        return {
            "data": [c.model_dump() for c in result.data],
            "meta": result.meta.model_dump() if result.meta else None,
        }
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Get a specific conversation by ID.

    - **conversation_id**: The conversation ID
    """
    try:
        conversation = await client.get_conversation(conversation_id)
        return conversation.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.post("/conversations")
async def create_conversation(
    request: CreateConversationRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Create a new conversation.

    - **source_id**: Unique source identifier
    - **inbox_id**: Inbox ID to create conversation in
    - **contact_id**: Optional contact ID
    """
    try:
        conv_status = ConversationStatus(request.status) if request.status else None

        conversation = await client.create_conversation(
            source_id=request.source_id,
            inbox_id=request.inbox_id,
            contact_id=request.contact_id,
            status=conv_status,
            assignee_id=request.assignee_id,
            team_id=request.team_id,
            additional_attributes=request.additional_attributes,
            custom_attributes=request.custom_attributes,
        )
        return conversation.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.patch("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: int,
    request: UpdateConversationRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Update a conversation.

    - **conversation_id**: The conversation ID
    - **status**: New status
    - **assignee_id**: New assignee
    - **team_id**: New team
    - **labels**: New labels
    """
    try:
        conv_status = ConversationStatus(request.status) if request.status else None

        conversation = await client.update_conversation(
            conversation_id=conversation_id,
            status=conv_status,
            assignee_id=request.assignee_id,
            team_id=request.team_id,
            labels=request.labels,
            priority=request.priority,
            snoozed_until=request.snoozed_until,
        )
        return conversation.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.post("/conversations/{conversation_id}/assignments")
async def assign_conversation(
    conversation_id: int,
    request: AssignConversationRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Assign a conversation to an agent or team.

    - **conversation_id**: The conversation ID
    - **assignee_id**: Agent ID to assign to
    - **team_id**: Team ID to assign to
    """
    try:
        conversation = await client.assign_conversation(
            conversation_id=conversation_id,
            assignee_id=request.assignee_id,
            team_id=request.team_id,
        )
        return conversation.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.post("/conversations/{conversation_id}/toggle_status")
async def toggle_conversation_status(
    conversation_id: int,
    request: ToggleStatusRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Toggle conversation status.

    - **conversation_id**: The conversation ID
    - **status**: New status (open, resolved, pending, snoozed)
    """
    try:
        conv_status = ConversationStatus(request.status)
        conversation = await client.toggle_conversation_status(
            conversation_id=conversation_id,
            status=conv_status,
        )
        return conversation.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.post("/conversations/{conversation_id}/labels")
async def add_labels_to_conversation(
    conversation_id: int,
    request: AddLabelsRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Add labels to a conversation.

    - **conversation_id**: The conversation ID
    - **labels**: List of label names
    """
    try:
        result = await client.add_labels_to_conversation(
            conversation_id=conversation_id,
            labels=request.labels,
        )
        return result
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


# ============================================================================
# Message Endpoints
# ============================================================================

@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: int,
    before: Optional[int] = Query(None, description="Get messages before this ID"),
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    List messages in a conversation.

    - **conversation_id**: The conversation ID
    - **before**: Get messages before this message ID
    """
    try:
        result = await client.list_messages(
            conversation_id=conversation_id,
            before=before,
        )
        return {
            "payload": [m.model_dump() for m in result.payload],
            "meta": result.meta.model_dump() if result.meta else None,
        }
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    request: SendMessageRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Send a message to a conversation.

    - **conversation_id**: The conversation ID
    - **content**: Message content
    - **message_type**: Type of message (incoming, outgoing)
    - **private**: Whether message is private (internal note)
    """
    try:
        message = await client.send_message(
            conversation_id=conversation_id,
            content=request.content,
            message_type=request.message_type,
            private=request.private,
            content_type=request.content_type,
            content_attributes=request.content_attributes,
            attachments=request.attachments,
            echo_id=request.echo_id,
        )
        return message.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.delete("/conversations/{conversation_id}/messages/{message_id}")
async def delete_message(
    conversation_id: int,
    message_id: int,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Delete a message from a conversation.

    - **conversation_id**: The conversation ID
    - **message_id**: The message ID to delete
    """
    try:
        result = await client.delete_message(
            conversation_id=conversation_id,
            message_id=message_id,
        )
        return {"status": "deleted", "message_id": message_id}
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


# ============================================================================
# Contact Endpoints
# ============================================================================

@router.get("/contacts")
async def list_contacts(
    page: int = Query(1, ge=1, description="Page number"),
    sort: Optional[str] = Query(None, description="Sort field"),
    order: Optional[str] = Query(None, description="Sort order (asc/desc)"),
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    List contacts with optional sorting.

    - **page**: Page number
    - **sort**: Sort field (name, email, phone_number, last_activity_at)
    - **order**: Sort order (asc, desc)
    """
    try:
        result = await client.list_contacts(
            page=page,
            sort=sort,
            order=order,
        )
        return {
            "data": [c.model_dump() for c in result.data],
            "meta": result.meta.model_dump() if result.meta else None,
        }
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.get("/contacts/search")
async def search_contacts(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Search contacts by query.

    - **q**: Search query string
    - **page**: Page number
    """
    try:
        result = await client.search_contacts(query=q, page=page)
        return {
            "data": [c.model_dump() for c in result.data],
            "meta": result.meta.model_dump() if result.meta else None,
        }
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.get("/contacts/{contact_id}")
async def get_contact(
    contact_id: int,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Get a specific contact by ID.

    - **contact_id**: The contact ID
    """
    try:
        contact = await client.get_contact(contact_id)
        return contact.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.post("/contacts")
async def create_contact(
    request: CreateContactRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Create a new contact.

    - **name**: Contact name
    - **email**: Contact email
    - **phone_number**: Contact phone number
    """
    try:
        contact = await client.create_contact(
            name=request.name,
            email=request.email,
            phone_number=request.phone_number,
            identifier=request.identifier,
            avatar_url=request.avatar_url,
            custom_attributes=request.custom_attributes,
        )
        return contact.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.put("/contacts/{contact_id}")
async def update_contact(
    contact_id: int,
    request: CreateContactRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Update a contact.

    - **contact_id**: The contact ID
    """
    try:
        contact = await client.update_contact(
            contact_id=contact_id,
            name=request.name,
            email=request.email,
            phone_number=request.phone_number,
            identifier=request.identifier,
            avatar_url=request.avatar_url,
            custom_attributes=request.custom_attributes,
        )
        return contact.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.get("/contacts/{contact_id}/conversations")
async def get_contact_conversations(
    contact_id: int,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Get all conversations for a contact.

    - **contact_id**: The contact ID
    """
    try:
        conversations = await client.get_contact_conversations(contact_id)
        return {"data": [c.model_dump() for c in conversations]}
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


# ============================================================================
# Agent Endpoints
# ============================================================================

@router.get("/agents")
async def list_agents(
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    List all agents in the account.
    """
    try:
        agents = await client.list_agents()
        return {"data": [a.model_dump() for a in agents]}
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.get("/agents/{agent_id}")
async def get_agent(
    agent_id: int,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Get a specific agent by ID.

    - **agent_id**: The agent ID
    """
    try:
        agent = await client.get_agent(agent_id)
        return agent.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


# ============================================================================
# Report Endpoints
# ============================================================================

@router.get("/reports/summary")
async def get_report_summary(
    type: str = Query("account", description="Report type"),
    since: Optional[int] = Query(None, description="Start timestamp"),
    until: Optional[int] = Query(None, description="End timestamp"),
    business_hours: bool = Query(False, description="Use business hours"),
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Get report summary statistics.

    - **type**: Report type (account, agent, inbox, label, team)
    - **since**: Start timestamp (Unix epoch)
    - **until**: End timestamp (Unix epoch)
    - **business_hours**: Calculate based on business hours
    """
    try:
        summary = await client.get_report_summary(
            report_type=type,
            since=since,
            until=until,
            business_hours=business_hours,
        )
        return summary.model_dump()
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


# ============================================================================
# Inbox & Team Endpoints
# ============================================================================

@router.get("/inboxes")
async def list_inboxes(
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    List all inboxes in the account.
    """
    try:
        inboxes = await client.list_inboxes()
        return {"data": inboxes}
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.get("/inboxes/{inbox_id}")
async def get_inbox(
    inbox_id: int,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Get a specific inbox by ID.

    - **inbox_id**: The inbox ID
    """
    try:
        inbox = await client.get_inbox(inbox_id)
        return inbox
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.get("/teams")
async def list_teams(
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    List all teams in the account.
    """
    try:
        teams = await client.list_teams()
        return {"data": teams}
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


# ============================================================================
# Label Endpoints
# ============================================================================

@router.get("/labels")
async def list_labels(
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    List all labels in the account.
    """
    try:
        labels = await client.list_labels()
        return {"data": labels}
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


@router.post("/labels")
async def create_label(
    request: CreateLabelRequest,
    client: ChatwootClient = Depends(get_client),
) -> Dict[str, Any]:
    """
    Create a new label.

    - **title**: Label title
    - **description**: Label description
    - **color**: Label color (hex)
    """
    try:
        label = await client.create_label(
            title=request.title,
            description=request.description,
            color=request.color,
            show_on_sidebar=request.show_on_sidebar,
        )
        return label
    except ChatwootError as e:
        raise handle_chatwoot_error(e)


# ============================================================================
# WebSocket Endpoint
# ============================================================================

class WebSocketManager:
    """Manager for WebSocket connections."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self._chatwoot_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket client connected: {client_id}")

    def disconnect(self, client_id: str) -> None:
        """Remove a WebSocket connection."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"WebSocket client disconnected: {client_id}")

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast message to all connected clients."""
        disconnected = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to {client_id}: {e}")
                disconnected.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect(client_id)

    async def send_to_client(self, client_id: str, message: Dict[str, Any]) -> None:
        """Send message to a specific client."""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to {client_id}: {e}")
                self.disconnect(client_id)


# Global WebSocket manager instance
ws_manager = WebSocketManager()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time Chatwoot updates.

    Connect to receive real-time events:
    - conversation_created
    - conversation_updated
    - message_created
    - message_updated
    - contact_created
    - contact_updated

    Query parameters:
    - client_id: Optional client identifier for targeting specific clients
    """
    # Generate client ID if not provided
    if not client_id:
        client_id = f"client_{datetime.now().timestamp()}"

    await ws_manager.connect(websocket, client_id)

    # Check if Chatwoot is configured
    if not chatwoot_client.is_configured:
        await websocket.send_json({
            "type": "error",
            "message": "Chatwoot integration is not configured",
        })
        ws_manager.disconnect(client_id)
        await websocket.close()
        return

    try:
        # Start listening for Chatwoot WebSocket events
        chatwoot_ws = chatwoot_client.websocket

        # Register event handlers
        async def on_chatwoot_event(data: Dict[str, Any]) -> None:
            await ws_manager.send_to_client(client_id, data)

        chatwoot_ws.on_event("*", on_chatwoot_event)

        # Connect to Chatwoot WebSocket if not already connected
        if not chatwoot_ws.is_connected:
            try:
                await chatwoot_ws.connect()
            except Exception as e:
                logger.error(f"Failed to connect to Chatwoot WebSocket: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Failed to connect to Chatwoot: {str(e)}",
                })

        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "client_id": client_id,
            "chatwoot_connected": chatwoot_ws.is_connected,
        })

        # Listen for client messages
        while True:
            try:
                data = await websocket.receive_json()

                # Handle ping/pong
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue

                # Handle subscription requests
                if data.get("type") == "subscribe":
                    event_types = data.get("events", [])
                    await websocket.send_json({
                        "type": "subscribed",
                        "events": event_types,
                    })
                    continue

                # Echo back unhandled messages
                await websocket.send_json({
                    "type": "received",
                    "data": data,
                })

            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        ws_manager.disconnect(client_id)


# ============================================================================
# Webhook Endpoint
# ============================================================================

# Event handlers registry
_webhook_handlers: Dict[str, List[callable]] = {}


def register_webhook_handler(
    event_type: Union[str, WebhookEventType],
    handler: callable,
) -> None:
    """
    Register a handler for Chatwoot webhook events.

    Args:
        event_type: Event type to handle (or '*' for all events)
        handler: Async function to handle the event
    """
    event_key = event_type.value if isinstance(event_type, WebhookEventType) else event_type
    if event_key not in _webhook_handlers:
        _webhook_handlers[event_key] = []
    _webhook_handlers[event_key].append(handler)
    logger.info(f"Registered webhook handler for: {event_key}")


async def _process_webhook_event(
    event_type: str,
    payload: Dict[str, Any],
) -> None:
    """Process a webhook event and call registered handlers."""
    # Call specific handlers
    handlers = _webhook_handlers.get(event_type, [])
    # Add wildcard handlers
    handlers.extend(_webhook_handlers.get("*", []))

    for handler in handlers:
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(event_type, payload)
            else:
                handler(event_type, payload)
        except Exception as e:
            logger.error(f"Error in webhook handler for {event_type}: {e}")

    # Broadcast to WebSocket clients
    await ws_manager.broadcast({
        "type": "webhook_event",
        "event": event_type,
        "data": payload,
    })


@router.post("/webhook")
async def chatwoot_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_chatwoot_signature: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Webhook endpoint for receiving Chatwoot events.

    Events received:
    - conversation_created
    - conversation_updated
    - conversation_status_changed
    - message_created
    - message_updated
    - webwidget_triggered
    - contact_created
    - contact_updated

    Headers:
    - X-Chatwoot-Signature: HMAC signature for verification (optional)
    """
    # Get raw body for signature verification
    body = await request.body()

    # Verify webhook signature if secret is configured
    webhook_secret = os.environ.get("CHATWOOT_WEBHOOK_SECRET")
    if webhook_secret and x_chatwoot_signature:
        if not verify_webhook_signature(body, x_chatwoot_signature, webhook_secret):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    # Extract event type
    event_type = payload.get("event", "unknown")

    logger.info(f"Received Chatwoot webhook: {event_type}")
    logger.debug(f"Webhook payload: {json.dumps(payload, indent=2)}")

    # Process event in background
    background_tasks.add_task(_process_webhook_event, event_type, payload)

    return {
        "status": "received",
        "event": event_type,
    }


# ============================================================================
# SSE (Server-Sent Events) Endpoint
# ============================================================================

@router.get("/events")
async def chatwoot_events(
    request: Request,
    client: ChatwootClient = Depends(get_client),
):
    """
    Server-Sent Events endpoint for real-time updates.

    Alternative to WebSocket for clients that prefer SSE.
    """
    from fastapi.responses import StreamingResponse

    async def event_generator():
        """Generate SSE events from Chatwoot WebSocket."""
        chatwoot_ws = client.websocket

        # Event queue for this client
        event_queue: asyncio.Queue = asyncio.Queue()

        async def on_event(data: Dict[str, Any]) -> None:
            await event_queue.put(data)

        chatwoot_ws.on_event("*", on_event)

        try:
            # Connect to Chatwoot WebSocket if not connected
            if not chatwoot_ws.is_connected:
                await chatwoot_ws.connect()

            # Send initial connected event
            yield f"event: connected\ndata: {json.dumps({'status': 'connected'})}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait for events with timeout
                    event = await asyncio.wait_for(
                        event_queue.get(),
                        timeout=30.0,
                    )
                    event_type = event.get("event_type", "message")
                    yield f"event: {event_type}\ndata: {json.dumps(event)}\n\n"

                except asyncio.TimeoutError:
                    # Send keepalive ping
                    yield f"event: ping\ndata: {json.dumps({'type': 'ping'})}\n\n"

        finally:
            chatwoot_ws.off_event("*", on_event)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
