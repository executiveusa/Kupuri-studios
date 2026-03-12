"""
Pydantic models for Chatwoot entities.

This module defines the data models for interacting with the Chatwoot API,
including conversations, contacts, messages, agents, and related entities.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# ============================================================================
# Enums
# ============================================================================

class ConversationStatus(str, Enum):
    """Conversation status enum matching Chatwoot API."""
    OPEN = "open"
    RESOLVED = "resolved"
    PENDING = "pending"
    SNOOZED = "snoozed"


class MessageType(str, Enum):
    """Message type enum matching Chatwoot API."""
    INCOMING = "incoming"
    OUTGOING = "outgoing"
    ACTIVITY = "activity"
    TEMPLATE = "template"


class MessageContentType(str, Enum):
    """Message content type enum."""
    TEXT = "text"
    INPUT_TEXT = "input_text"
    INPUT_TEXTAREA = "input_textarea"
    INPUT_EMAIL = "input_email"
    INPUT_SELECT = "input_select"
    CARDS = "cards"
    FORM = "form"
    ARTICLE = "article"
    INTEGRATIONS = "integrations"


class InboxType(str, Enum):
    """Inbox type enum."""
    WEB_WIDGET = "Channel::WebWidget"
    API = "Channel::Api"
    EMAIL = "Channel::Email"
    FACEBOOK = "Channel::FacebookPage"
    TWITTER = "Channel::TwitterProfile"
    WHATSAPP = "Channel::Whatsapp"
    SMS = "Channel::Sms"
    TELEGRAM = "Channel::Telegram"
    LINE = "Channel::Line"


class AgentAvailability(str, Enum):
    """Agent availability status."""
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"


# ============================================================================
# Base Models
# ============================================================================

class ChatwootTimestamps(BaseModel):
    """Base model with timestamp fields."""
    created_at: Optional[Union[datetime, int]] = None
    updated_at: Optional[Union[datetime, int]] = None


# ============================================================================
# Contact Models
# ============================================================================

class ContactAttribute(BaseModel):
    """Custom attribute for a contact."""
    attribute_key: str
    attribute_value: Any


class Contact(ChatwootTimestamps):
    """Chatwoot contact model."""
    id: int
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    thumbnail: Optional[str] = None
    avatar: Optional[str] = None
    identifier: Optional[str] = None
    custom_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    additional_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    last_activity_at: Optional[Union[datetime, int]] = None
    availability_status: Optional[str] = None


class ContactCreate(BaseModel):
    """Model for creating a new contact."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    identifier: Optional[str] = None
    avatar_url: Optional[str] = None
    custom_attributes: Optional[Dict[str, Any]] = None


class ContactUpdate(BaseModel):
    """Model for updating a contact."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    identifier: Optional[str] = None
    avatar_url: Optional[str] = None
    custom_attributes: Optional[Dict[str, Any]] = None


# ============================================================================
# Agent Models
# ============================================================================

class Agent(ChatwootTimestamps):
    """Chatwoot agent model."""
    id: int
    account_id: Optional[int] = None
    name: str
    email: str
    role: Optional[str] = None
    availability_status: Optional[AgentAvailability] = None
    auto_offline: Optional[bool] = None
    confirmed: Optional[bool] = None
    thumbnail: Optional[str] = None
    avatar_url: Optional[str] = None
    custom_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AgentBot(BaseModel):
    """Agent bot model."""
    id: int
    name: str
    description: Optional[str] = None
    account_id: Optional[int] = None
    outgoing_url: Optional[str] = None


# ============================================================================
# Inbox Models
# ============================================================================

class Inbox(ChatwootTimestamps):
    """Chatwoot inbox model."""
    id: int
    name: str
    channel_type: Optional[InboxType] = None
    avatar_url: Optional[str] = None
    greeting_enabled: Optional[bool] = None
    greeting_message: Optional[str] = None
    working_hours_enabled: Optional[bool] = None
    enable_auto_assignment: Optional[bool] = None
    out_of_office_message: Optional[str] = None
    timezone: Optional[str] = None
    enable_email_collect: Optional[bool] = None
    csat_survey_enabled: Optional[bool] = None
    allow_messages_after_resolved: Optional[bool] = None


# ============================================================================
# Message Models
# ============================================================================

class MessageAttachment(BaseModel):
    """Message attachment model."""
    id: int
    message_id: int
    file_type: Optional[str] = None
    account_id: Optional[int] = None
    extension: Optional[str] = None
    data_url: Optional[str] = None
    thumb_url: Optional[str] = None
    file_size: Optional[int] = None


class MessageSender(BaseModel):
    """Message sender model."""
    id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    type: Optional[str] = None  # 'user', 'contact', 'agent_bot'
    thumbnail: Optional[str] = None
    avatar_url: Optional[str] = None


class Message(ChatwootTimestamps):
    """Chatwoot message model."""
    id: int
    content: Optional[str] = None
    content_type: Optional[MessageContentType] = MessageContentType.TEXT
    content_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    message_type: Optional[MessageType] = None
    account_id: Optional[int] = None
    inbox_id: Optional[int] = None
    conversation_id: Optional[int] = None
    private: Optional[bool] = False
    sender: Optional[MessageSender] = None
    attachments: Optional[List[MessageAttachment]] = Field(default_factory=list)
    source_id: Optional[str] = None
    external_source_ids: Optional[Dict[str, Any]] = Field(default_factory=dict)


class MessageCreate(BaseModel):
    """Model for creating a new message."""
    content: str
    message_type: Optional[MessageType] = MessageType.OUTGOING
    private: Optional[bool] = False
    content_type: Optional[MessageContentType] = MessageContentType.TEXT
    content_attributes: Optional[Dict[str, Any]] = None
    template_params: Optional[Dict[str, Any]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    file_type: Optional[str] = None
    echo_id: Optional[str] = None


# ============================================================================
# Conversation Models
# ============================================================================

class ConversationMeta(BaseModel):
    """Conversation metadata model."""
    sender: Optional[Contact] = None
    assignee: Optional[Agent] = None
    team: Optional[Dict[str, Any]] = None
    hmac_verified: Optional[bool] = None


class ConversationLabels(BaseModel):
    """Conversation labels."""
    labels: List[str] = Field(default_factory=list)


class Conversation(ChatwootTimestamps):
    """Chatwoot conversation model."""
    id: int
    account_id: Optional[int] = None
    inbox_id: Optional[int] = None
    contact_id: Optional[int] = None
    assignee_id: Optional[int] = None
    team_id: Optional[int] = None
    status: Optional[ConversationStatus] = ConversationStatus.OPEN
    agent_last_seen_at: Optional[Union[datetime, int]] = None
    contact_last_seen_at: Optional[Union[datetime, int]] = None
    last_activity_at: Optional[Union[datetime, int]] = None
    additional_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    custom_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    messages: Optional[List[Message]] = Field(default_factory=list)
    meta: Optional[ConversationMeta] = None
    labels: Optional[List[str]] = Field(default_factory=list)
    unread_count: Optional[int] = 0
    first_reply_created_at: Optional[Union[datetime, int]] = None
    priority: Optional[str] = None
    snoozed_until: Optional[Union[datetime, int]] = None
    uuid: Optional[str] = None
    identifier: Optional[str] = None


class ConversationCreate(BaseModel):
    """Model for creating a new conversation."""
    source_id: str
    inbox_id: int
    contact_id: Optional[int] = None
    additional_attributes: Optional[Dict[str, Any]] = None
    custom_attributes: Optional[Dict[str, Any]] = None
    status: Optional[ConversationStatus] = ConversationStatus.OPEN
    assignee_id: Optional[int] = None
    team_id: Optional[int] = None


class ConversationUpdate(BaseModel):
    """Model for updating a conversation."""
    status: Optional[ConversationStatus] = None
    assignee_id: Optional[int] = None
    team_id: Optional[int] = None
    labels: Optional[List[str]] = None
    priority: Optional[str] = None
    snoozed_until: Optional[int] = None


class ConversationAssignment(BaseModel):
    """Model for assigning a conversation."""
    assignee_id: Optional[int] = None
    team_id: Optional[int] = None


# ============================================================================
# Report Models
# ============================================================================

class ReportSummary(BaseModel):
    """Report summary model."""
    conversations_count: Optional[int] = None
    incoming_messages_count: Optional[int] = None
    outgoing_messages_count: Optional[int] = None
    avg_first_response_time: Optional[float] = None
    avg_resolution_time: Optional[float] = None
    resolutions_count: Optional[int] = None
    previous_conversations_count: Optional[int] = None
    previous_incoming_messages_count: Optional[int] = None
    previous_outgoing_messages_count: Optional[int] = None
    previous_avg_first_response_time: Optional[float] = None
    previous_avg_resolution_time: Optional[float] = None
    previous_resolutions_count: Optional[int] = None


class ReportMetric(BaseModel):
    """Individual report metric."""
    value: Optional[float] = None
    timestamp: Optional[int] = None


class Report(BaseModel):
    """Report model with metrics."""
    metrics: Optional[List[ReportMetric]] = Field(default_factory=list)
    summary: Optional[ReportSummary] = None


# ============================================================================
# Webhook Event Models
# ============================================================================

class WebhookEventType(str, Enum):
    """Webhook event types from Chatwoot."""
    CONVERSATION_CREATED = "conversation_created"
    CONVERSATION_UPDATED = "conversation_updated"
    CONVERSATION_STATUS_CHANGED = "conversation_status_changed"
    MESSAGE_CREATED = "message_created"
    MESSAGE_UPDATED = "message_updated"
    WEBWIDGET_TRIGGERED = "webwidget_triggered"
    CONTACT_CREATED = "contact_created"
    CONTACT_UPDATED = "contact_updated"


class WebhookPayload(BaseModel):
    """Base webhook payload model."""
    event: WebhookEventType
    account: Optional[Dict[str, Any]] = None
    inbox: Optional[Inbox] = None
    conversation: Optional[Conversation] = None
    message: Optional[Message] = None
    contact: Optional[Contact] = None
    sender: Optional[MessageSender] = None
    timestamp: Optional[int] = None


class ConversationWebhookPayload(WebhookPayload):
    """Webhook payload for conversation events."""
    conversation: Conversation


class MessageWebhookPayload(WebhookPayload):
    """Webhook payload for message events."""
    message: Message
    conversation: Conversation


class ContactWebhookPayload(WebhookPayload):
    """Webhook payload for contact events."""
    contact: Contact


# ============================================================================
# Pagination Models
# ============================================================================

class PaginationMeta(BaseModel):
    """Pagination metadata."""
    current_page: Optional[int] = 1
    total_pages: Optional[int] = None
    total_count: Optional[int] = None
    per_page: Optional[int] = 25


class PaginatedConversations(BaseModel):
    """Paginated list of conversations."""
    data: List[Conversation] = Field(default_factory=list)
    meta: Optional[PaginationMeta] = None


class PaginatedContacts(BaseModel):
    """Paginated list of contacts."""
    data: List[Contact] = Field(default_factory=list)
    meta: Optional[PaginationMeta] = None


class PaginatedMessages(BaseModel):
    """Paginated list of messages."""
    payload: List[Message] = Field(default_factory=list)
    meta: Optional[PaginationMeta] = None


# ============================================================================
# Response Models
# ============================================================================

class ChatwootError(BaseModel):
    """Error response from Chatwoot API."""
    success: bool = False
    message: Optional[str] = None
    errors: Optional[List[str]] = Field(default_factory=list)
    description: Optional[str] = None


class ChatwootResponse(BaseModel):
    """Generic Chatwoot API response wrapper."""
    success: bool = True
    data: Optional[Any] = None
    error: Optional[ChatwootError] = None


# ============================================================================
# WebSocket Event Models
# ============================================================================

class WebSocketEvent(BaseModel):
    """WebSocket event model for real-time updates."""
    event_type: str
    data: Dict[str, Any]
    account_id: Optional[int] = None
    conversation_id: Optional[int] = None
    timestamp: Optional[datetime] = None


class ConversationTypingEvent(BaseModel):
    """Typing indicator event."""
    conversation_id: int
    user_id: int
    user_type: str  # 'user' or 'contact'
    is_typing: bool


class PresenceUpdateEvent(BaseModel):
    """User presence update event."""
    user_id: int
    availability_status: AgentAvailability
    accounts: Optional[List[int]] = Field(default_factory=list)


# ============================================================================
# Filter Models
# ============================================================================

class ConversationFilter(BaseModel):
    """Filter parameters for conversation queries."""
    status: Optional[ConversationStatus] = None
    assignee_type: Optional[str] = None  # 'me', 'unassigned', 'all'
    inbox_id: Optional[int] = None
    team_id: Optional[int] = None
    labels: Optional[List[str]] = None
    page: Optional[int] = 1


class ContactFilter(BaseModel):
    """Filter parameters for contact queries."""
    page: Optional[int] = 1
    sort: Optional[str] = None  # 'name', 'email', 'phone_number', 'last_activity_at'
    order: Optional[str] = None  # 'asc', 'desc'
