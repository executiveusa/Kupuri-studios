"""
Kupuri Studios - Enhanced Chatwoot Service
==========================================
Complete Chatwoot API integration for omnichannel inbox.
"""

import httpx
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Optional
import os

logger = logging.getLogger(__name__)


class ConversationStatus(Enum):
    """Chatwoot conversation statuses."""
    OPEN = "open"
    RESOLVED = "resolved"
    PENDING = "pending"
    SNOOZED = "snoozed"


class MessageType(Enum):
    """Message types."""
    INCOMING = "incoming"
    OUTGOING = "outgoing"


class ContactSource(Enum):
    """Contact source channels."""
    WEBSITE = "Website"
    WHATSAPP = "Whatsapp"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    EMAIL = "Email"
    API = "Api"
    SMS = "Sms"


@dataclass
class ChatwootContact:
    """Chatwoot contact model."""
    id: int
    name: Optional[str]
    email: Optional[str]
    phone_number: Optional[str]
    identifier: Optional[str]
    custom_attributes: dict
    created_at: datetime
    
    @classmethod
    def from_api(cls, data: dict) -> "ChatwootContact":
        return cls(
            id=data["id"],
            name=data.get("name"),
            email=data.get("email"),
            phone_number=data.get("phone_number"),
            identifier=data.get("identifier"),
            custom_attributes=data.get("custom_attributes", {}),
            created_at=datetime.fromisoformat(
                data["created_at"].replace("Z", "+00:00")
            ) if data.get("created_at") else datetime.utcnow()
        )


@dataclass
class ChatwootConversation:
    """Chatwoot conversation model."""
    id: int
    account_id: int
    inbox_id: int
    contact_id: int
    status: ConversationStatus
    assignee_id: Optional[int]
    team_id: Optional[int]
    messages_count: int
    unread_count: int
    created_at: datetime
    last_activity_at: datetime
    custom_attributes: dict
    labels: list[str]
    
    @classmethod
    def from_api(cls, data: dict) -> "ChatwootConversation":
        return cls(
            id=data["id"],
            account_id=data["account_id"],
            inbox_id=data["inbox_id"],
            contact_id=data.get("meta", {}).get("sender", {}).get("id", 0),
            status=ConversationStatus(data.get("status", "open")),
            assignee_id=data.get("meta", {}).get("assignee", {}).get("id"),
            team_id=data.get("meta", {}).get("team", {}).get("id"),
            messages_count=data.get("messages_count", 0),
            unread_count=data.get("unread_count", 0),
            created_at=datetime.fromisoformat(
                data["created_at"].replace("Z", "+00:00")
            ) if data.get("created_at") else datetime.utcnow(),
            last_activity_at=datetime.fromisoformat(
                data["last_activity_at"].replace("Z", "+00:00")
            ) if data.get("last_activity_at") else datetime.utcnow(),
            custom_attributes=data.get("custom_attributes", {}),
            labels=data.get("labels", [])
        )


@dataclass
class ChatwootMessage:
    """Chatwoot message model."""
    id: int
    conversation_id: int
    content: str
    content_type: str
    message_type: MessageType
    created_at: datetime
    sender_type: str
    sender_id: int
    attachments: list[dict]
    
    @classmethod
    def from_api(cls, data: dict) -> "ChatwootMessage":
        return cls(
            id=data["id"],
            conversation_id=data.get("conversation_id", 0),
            content=data.get("content", ""),
            content_type=data.get("content_type", "text"),
            message_type=MessageType(data.get("message_type", 0)),
            created_at=datetime.fromisoformat(
                data["created_at"].replace("Z", "+00:00")
            ) if data.get("created_at") else datetime.utcnow(),
            sender_type=data.get("sender", {}).get("type", ""),
            sender_id=data.get("sender", {}).get("id", 0),
            attachments=data.get("attachments", [])
        )


class ChatwootService:
    """
    Service for Chatwoot API integration.
    Provides unified inbox management for multi-channel support.
    """
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_token: Optional[str] = None,
        account_id: Optional[int] = None
    ):
        self.base_url = base_url or os.getenv("CHATWOOT_BASE_URL", "https://app.chatwoot.com")
        self.api_token = api_token or os.getenv("CHATWOOT_API_TOKEN", "")
        self.account_id = account_id or int(os.getenv("CHATWOOT_ACCOUNT_ID", "1"))
        
        self._client = httpx.AsyncClient(
            base_url=f"{self.base_url}/api/v1/accounts/{self.account_id}",
            headers={
                "api_access_token": self.api_token,
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()
    
    # ==================== Contacts ====================
    
    async def create_contact(
        self,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone_number: Optional[str] = None,
        identifier: Optional[str] = None,
        custom_attributes: Optional[dict] = None
    ) -> ChatwootContact:
        """Create a new contact."""
        payload = {}
        if name:
            payload["name"] = name
        if email:
            payload["email"] = email
        if phone_number:
            payload["phone_number"] = phone_number
        if identifier:
            payload["identifier"] = identifier
        if custom_attributes:
            payload["custom_attributes"] = custom_attributes
        
        response = await self._client.post("/contacts", json=payload)
        response.raise_for_status()
        
        data = response.json()
        return ChatwootContact.from_api(data.get("payload", {}).get("contact", data))
    
    async def get_contact(self, contact_id: int) -> ChatwootContact:
        """Get a contact by ID."""
        response = await self._client.get(f"/contacts/{contact_id}")
        response.raise_for_status()
        
        data = response.json()
        return ChatwootContact.from_api(data.get("payload", data))
    
    async def search_contacts(
        self,
        query: str,
        page: int = 1
    ) -> list[ChatwootContact]:
        """Search contacts by query."""
        response = await self._client.get(
            "/contacts/search",
            params={"q": query, "page": page}
        )
        response.raise_for_status()
        
        data = response.json()
        contacts = data.get("payload", [])
        return [ChatwootContact.from_api(c) for c in contacts]
    
    async def update_contact(
        self,
        contact_id: int,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone_number: Optional[str] = None,
        custom_attributes: Optional[dict] = None
    ) -> ChatwootContact:
        """Update a contact."""
        payload = {}
        if name:
            payload["name"] = name
        if email:
            payload["email"] = email
        if phone_number:
            payload["phone_number"] = phone_number
        if custom_attributes:
            payload["custom_attributes"] = custom_attributes
        
        response = await self._client.put(f"/contacts/{contact_id}", json=payload)
        response.raise_for_status()
        
        data = response.json()
        return ChatwootContact.from_api(data.get("payload", {}).get("contact", data))
    
    # ==================== Conversations ====================
    
    async def create_conversation(
        self,
        contact_id: int,
        inbox_id: int,
        status: ConversationStatus = ConversationStatus.OPEN,
        assignee_id: Optional[int] = None,
        team_id: Optional[int] = None
    ) -> ChatwootConversation:
        """Create a new conversation."""
        payload = {
            "contact_id": contact_id,
            "inbox_id": inbox_id,
            "status": status.value
        }
        if assignee_id:
            payload["assignee_id"] = assignee_id
        if team_id:
            payload["team_id"] = team_id
        
        response = await self._client.post("/conversations", json=payload)
        response.raise_for_status()
        
        return ChatwootConversation.from_api(response.json())
    
    async def get_conversations(
        self,
        status: Optional[ConversationStatus] = None,
        assignee_id: Optional[int] = None,
        inbox_id: Optional[int] = None,
        team_id: Optional[int] = None,
        labels: Optional[list[str]] = None,
        page: int = 1
    ) -> list[ChatwootConversation]:
        """Get conversations with filters."""
        params = {"page": page}
        if status:
            params["status"] = status.value
        if assignee_id:
            params["assignee_id"] = assignee_id
        if inbox_id:
            params["inbox_id"] = inbox_id
        if team_id:
            params["team_id"] = team_id
        if labels:
            params["labels"] = labels
        
        response = await self._client.get("/conversations", params=params)
        response.raise_for_status()
        
        data = response.json()
        conversations = data.get("data", {}).get("payload", [])
        return [ChatwootConversation.from_api(c) for c in conversations]
    
    async def get_conversation(self, conversation_id: int) -> ChatwootConversation:
        """Get a single conversation."""
        response = await self._client.get(f"/conversations/{conversation_id}")
        response.raise_for_status()
        
        return ChatwootConversation.from_api(response.json())
    
    async def update_conversation(
        self,
        conversation_id: int,
        status: Optional[ConversationStatus] = None,
        assignee_id: Optional[int] = None,
        team_id: Optional[int] = None,
        labels: Optional[list[str]] = None,
        custom_attributes: Optional[dict] = None
    ) -> ChatwootConversation:
        """Update a conversation."""
        payload = {}
        if status:
            payload["status"] = status.value
        if assignee_id is not None:
            payload["assignee_id"] = assignee_id
        if team_id is not None:
            payload["team_id"] = team_id
        if labels is not None:
            payload["labels"] = labels
        if custom_attributes:
            payload["custom_attributes"] = custom_attributes
        
        response = await self._client.patch(
            f"/conversations/{conversation_id}",
            json=payload
        )
        response.raise_for_status()
        
        return ChatwootConversation.from_api(response.json())
    
    async def assign_conversation(
        self,
        conversation_id: int,
        assignee_id: int
    ) -> ChatwootConversation:
        """Assign a conversation to an agent."""
        response = await self._client.post(
            f"/conversations/{conversation_id}/assignments",
            json={"assignee_id": assignee_id}
        )
        response.raise_for_status()
        
        return ChatwootConversation.from_api(response.json())
    
    # ==================== Messages ====================
    
    async def send_message(
        self,
        conversation_id: int,
        content: str,
        message_type: MessageType = MessageType.OUTGOING,
        private: bool = False,
        content_type: str = "text",
        attachments: Optional[list[dict]] = None
    ) -> ChatwootMessage:
        """Send a message to a conversation."""
        payload = {
            "content": content,
            "message_type": message_type.value,
            "private": private,
            "content_type": content_type
        }
        if attachments:
            payload["attachments"] = attachments
        
        response = await self._client.post(
            f"/conversations/{conversation_id}/messages",
            json=payload
        )
        response.raise_for_status()
        
        return ChatwootMessage.from_api(response.json())
    
    async def get_messages(
        self,
        conversation_id: int,
        before: Optional[int] = None
    ) -> list[ChatwootMessage]:
        """Get messages for a conversation."""
        params = {}
        if before:
            params["before"] = before
        
        response = await self._client.get(
            f"/conversations/{conversation_id}/messages",
            params=params
        )
        response.raise_for_status()
        
        data = response.json()
        messages = data.get("payload", [])
        return [ChatwootMessage.from_api(m) for m in messages]
    
    # ==================== Inboxes ====================
    
    async def get_inboxes(self) -> list[dict]:
        """Get all inboxes."""
        response = await self._client.get("/inboxes")
        response.raise_for_status()
        
        data = response.json()
        return data.get("payload", [])
    
    # ==================== Teams ====================
    
    async def get_teams(self) -> list[dict]:
        """Get all teams."""
        response = await self._client.get("/teams")
        response.raise_for_status()
        
        return response.json()
    
    # ==================== Agents ====================
    
    async def get_agents(self) -> list[dict]:
        """Get all agents."""
        response = await self._client.get("/agents")
        response.raise_for_status()
        
        return response.json()
    
    # ==================== Labels ====================
    
    async def get_labels(self) -> list[dict]:
        """Get all labels."""
        response = await self._client.get("/labels")
        response.raise_for_status()
        
        data = response.json()
        return data.get("payload", [])
    
    async def add_label_to_conversation(
        self,
        conversation_id: int,
        labels: list[str]
    ) -> dict:
        """Add labels to a conversation."""
        response = await self._client.post(
            f"/conversations/{conversation_id}/labels",
            json={"labels": labels}
        )
        response.raise_for_status()
        
        return response.json()
    
    # ==================== Reports ====================
    
    async def get_conversation_metrics(
        self,
        type: str = "account",
        since: Optional[str] = None,
        until: Optional[str] = None
    ) -> dict:
        """Get conversation metrics."""
        params = {"type": type}
        if since:
            params["since"] = since
        if until:
            params["until"] = until
        
        response = await self._client.get("/reports/summary", params=params)
        response.raise_for_status()
        
        return response.json()


# Singleton instance
_chatwoot_service: Optional[ChatwootService] = None


def get_chatwoot_service() -> ChatwootService:
    """Get or create Chatwoot service instance."""
    global _chatwoot_service
    if _chatwoot_service is None:
        _chatwoot_service = ChatwootService()
    return _chatwoot_service


__all__ = [
    "ChatwootService",
    "ChatwootContact",
    "ChatwootConversation",
    "ChatwootMessage",
    "ConversationStatus",
    "MessageType",
    "ContactSource",
    "get_chatwoot_service"
]
