"""
Chatwoot Service - Integration layer for Chatwoot API.

This module provides a comprehensive client for interacting with the Chatwoot API,
including support for conversations, contacts, messages, agents, and real-time
WebSocket connections for live updates.

Features:
- Async HTTP methods using httpx
- WebSocket connection for real-time updates
- Automatic retry logic with exponential backoff
- Comprehensive error handling
- Environment variable configuration

Configuration:
- CHATWOOT_URL: Base URL for Chatwoot instance
- CHATWOOT_API_KEY: API access token for authentication
- CHATWOOT_ACCOUNT_ID: Account ID for API requests
"""

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from enum import Enum
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Union

import httpx
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

from models.chatwoot_models import (
    Agent,
    Contact,
    ContactCreate,
    ContactFilter,
    ContactUpdate,
    Conversation,
    ConversationAssignment,
    ConversationCreate,
    ConversationFilter,
    ConversationStatus,
    ConversationUpdate,
    Message,
    MessageCreate,
    PaginatedContacts,
    PaginatedConversations,
    PaginatedMessages,
    ReportSummary,
    WebhookPayload,
    WebSocketEvent,
)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Add handler if not already configured
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    )
    logger.addHandler(handler)


# ============================================================================
# Custom Exceptions
# ============================================================================

class ChatwootError(Exception):
    """Base exception for Chatwoot errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response_data: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}
        super().__init__(self.message)


class ChatwootAuthenticationError(ChatwootError):
    """Authentication failed - invalid or expired API key."""
    pass


class ChatwootNotFoundError(ChatwootError):
    """Resource not found."""
    pass


class ChatwootRateLimitError(ChatwootError):
    """Rate limit exceeded."""

    def __init__(
        self,
        message: str,
        retry_after: Optional[int] = None,
        **kwargs: Any,
    ):
        super().__init__(message, **kwargs)
        self.retry_after = retry_after


class ChatwootValidationError(ChatwootError):
    """Request validation failed."""
    pass


class ChatwootConnectionError(ChatwootError):
    """Connection to Chatwoot failed."""
    pass


class ChatwootWebSocketError(ChatwootError):
    """WebSocket connection error."""
    pass


# ============================================================================
# Configuration
# ============================================================================

class ChatwootConfig:
    """Configuration for Chatwoot client."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        account_id: Optional[int] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ):
        self.base_url = (
            base_url or os.environ.get("CHATWOOT_URL", "").rstrip("/")
        )
        self.api_key = api_key or os.environ.get("CHATWOOT_API_KEY", "")
        self.account_id = account_id or int(
            os.environ.get("CHATWOOT_ACCOUNT_ID", "0")
        )
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        # Validate configuration
        if not self.base_url:
            logger.warning(
                "CHATWOOT_URL not configured - Chatwoot integration disabled"
            )
        if not self.api_key:
            logger.warning(
                "CHATWOOT_API_KEY not configured - Chatwoot integration disabled"
            )

    @property
    def is_configured(self) -> bool:
        """Check if Chatwoot is properly configured."""
        return bool(self.base_url and self.api_key and self.account_id)

    @property
    def api_base_url(self) -> str:
        """Get the API base URL with account ID."""
        return f"{self.base_url}/api/v1/accounts/{self.account_id}"

    @property
    def websocket_url(self) -> str:
        """Get the WebSocket URL."""
        ws_base = self.base_url.replace("https://", "wss://").replace(
            "http://", "ws://"
        )
        return f"{ws_base}/cable"


# ============================================================================
# HTTP Client Mixin
# ============================================================================

class ChatwootHTTPClient:
    """HTTP client mixin with retry logic and error handling."""

    def __init__(self, config: ChatwootConfig):
        self.config = config
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def headers(self) -> Dict[str, str]:
        """Get default headers for API requests."""
        return {
            "api_access_token": self.config.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.config.timeout,
                headers=self.headers,
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _handle_response_error(
        self, response: httpx.Response, context: str = ""
    ) -> None:
        """Handle HTTP response errors."""
        status_code = response.status_code

        try:
            response_data = response.json()
        except (json.JSONDecodeError, ValueError):
            response_data = {"raw": response.text}

        error_message = response_data.get(
            "message", response_data.get("error", f"HTTP {status_code}")
        )
        full_message = f"{context}: {error_message}" if context else error_message

        if status_code == 401:
            raise ChatwootAuthenticationError(
                full_message,
                status_code=status_code,
                response_data=response_data,
            )
        elif status_code == 404:
            raise ChatwootNotFoundError(
                full_message,
                status_code=status_code,
                response_data=response_data,
            )
        elif status_code == 422:
            raise ChatwootValidationError(
                full_message,
                status_code=status_code,
                response_data=response_data,
            )
        elif status_code == 429:
            retry_after = response.headers.get("Retry-After")
            raise ChatwootRateLimitError(
                full_message,
                status_code=status_code,
                response_data=response_data,
                retry_after=int(retry_after) if retry_after else None,
            )
        else:
            raise ChatwootError(
                full_message,
                status_code=status_code,
                response_data=response_data,
            )

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        context: str = "",
    ) -> Dict[str, Any]:
        """Make an HTTP request with retry logic."""
        client = await self._get_client()
        url = f"{self.config.api_base_url}{endpoint}"

        last_exception: Optional[Exception] = None

        for attempt in range(self.config.max_retries):
            try:
                logger.debug(
                    f"Request {method} {url} (attempt {attempt + 1}/{self.config.max_retries})"
                )

                response = await client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                )

                if response.status_code >= 400:
                    # Handle rate limiting with retry
                    if response.status_code == 429:
                        retry_after = response.headers.get("Retry-After", "5")
                        wait_time = int(retry_after)
                        logger.warning(
                            f"Rate limited, waiting {wait_time}s before retry"
                        )
                        await asyncio.sleep(wait_time)
                        continue

                    self._handle_response_error(response, context)

                # Handle empty response
                if response.status_code == 204 or not response.content:
                    return {}

                return response.json()

            except (httpx.ConnectError, httpx.TimeoutException) as e:
                last_exception = ChatwootConnectionError(
                    f"Connection failed: {str(e)}"
                )
                logger.warning(
                    f"Connection error (attempt {attempt + 1}): {e}"
                )

                if attempt < self.config.max_retries - 1:
                    wait_time = self.config.retry_delay * (2 ** attempt)
                    await asyncio.sleep(wait_time)

            except ChatwootRateLimitError:
                # Already handled above with retry
                raise

            except ChatwootError:
                # Don't retry client errors
                raise

        # All retries exhausted
        if last_exception:
            raise last_exception
        raise ChatwootConnectionError("Request failed after all retries")

    async def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        context: str = "",
    ) -> Dict[str, Any]:
        """Make a GET request."""
        return await self._request("GET", endpoint, params=params, context=context)

    async def post(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        context: str = "",
    ) -> Dict[str, Any]:
        """Make a POST request."""
        return await self._request("POST", endpoint, data=data, context=context)

    async def patch(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        context: str = "",
    ) -> Dict[str, Any]:
        """Make a PATCH request."""
        return await self._request("PATCH", endpoint, data=data, context=context)

    async def put(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        context: str = "",
    ) -> Dict[str, Any]:
        """Make a PUT request."""
        return await self._request("PUT", endpoint, data=data, context=context)

    async def delete(
        self,
        endpoint: str,
        context: str = "",
    ) -> Dict[str, Any]:
        """Make a DELETE request."""
        return await self._request("DELETE", endpoint, context=context)


# ============================================================================
# WebSocket Client
# ============================================================================

class ChatwootWebSocketClient:
    """WebSocket client for real-time Chatwoot updates."""

    def __init__(self, config: ChatwootConfig):
        self.config = config
        self._websocket: Optional[websockets.WebSocketClientProtocol] = None
        self._connected: bool = False
        self._reconnect_task: Optional[asyncio.Task] = None
        self._event_handlers: Dict[str, List[Callable]] = {}
        self._should_reconnect: bool = True
        self._ping_task: Optional[asyncio.Task] = None

    @property
    def is_connected(self) -> bool:
        """Check if WebSocket is connected."""
        return self._connected and self._websocket is not None

    def on_event(self, event_type: str, handler: Callable) -> None:
        """Register an event handler for a specific event type."""
        if event_type not in self._event_handlers:
            self._event_handlers[event_type] = []
        self._event_handlers[event_type].append(handler)
        logger.debug(f"Registered handler for event: {event_type}")

    def off_event(self, event_type: str, handler: Callable) -> None:
        """Remove an event handler."""
        if event_type in self._event_handlers:
            self._event_handlers[event_type] = [
                h for h in self._event_handlers[event_type] if h != handler
            ]

    async def _emit_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Emit an event to all registered handlers."""
        handlers = self._event_handlers.get(event_type, [])
        handlers.extend(self._event_handlers.get("*", []))  # Wildcard handlers

        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
            except Exception as e:
                logger.error(f"Error in event handler for {event_type}: {e}")

    async def connect(self) -> None:
        """Connect to the Chatwoot WebSocket."""
        if not self.config.is_configured:
            raise ChatwootWebSocketError("Chatwoot is not configured")

        try:
            # Build WebSocket URL with auth token
            ws_url = f"{self.config.websocket_url}?token={self.config.api_key}"

            logger.info(f"Connecting to Chatwoot WebSocket: {self.config.websocket_url}")

            self._websocket = await websockets.connect(
                ws_url,
                ping_interval=30,
                ping_timeout=10,
                close_timeout=10,
            )
            self._connected = True

            # Subscribe to account channel
            await self._subscribe_to_account()

            # Start ping task
            self._ping_task = asyncio.create_task(self._ping_loop())

            logger.info("Successfully connected to Chatwoot WebSocket")
            await self._emit_event("connected", {})

        except Exception as e:
            self._connected = False
            logger.error(f"Failed to connect to WebSocket: {e}")
            raise ChatwootWebSocketError(f"WebSocket connection failed: {e}")

    async def _subscribe_to_account(self) -> None:
        """Subscribe to the account channel for updates."""
        if not self._websocket:
            return

        # ActionCable subscription message
        subscribe_message = {
            "command": "subscribe",
            "identifier": json.dumps({
                "channel": "RoomChannel",
                "pubsub_token": self.config.api_key,
                "account_id": self.config.account_id,
            }),
        }

        await self._websocket.send(json.dumps(subscribe_message))
        logger.debug(f"Subscribed to account {self.config.account_id}")

    async def _ping_loop(self) -> None:
        """Send periodic pings to keep connection alive."""
        while self._connected and self._websocket:
            try:
                await asyncio.sleep(25)
                if self._websocket:
                    # ActionCable ping
                    await self._websocket.send(json.dumps({"type": "ping"}))
            except Exception as e:
                logger.warning(f"Ping failed: {e}")
                break

    async def disconnect(self) -> None:
        """Disconnect from the WebSocket."""
        self._should_reconnect = False
        self._connected = False

        if self._ping_task:
            self._ping_task.cancel()
            self._ping_task = None

        if self._reconnect_task:
            self._reconnect_task.cancel()
            self._reconnect_task = None

        if self._websocket:
            try:
                await self._websocket.close()
            except Exception as e:
                logger.warning(f"Error closing WebSocket: {e}")
            finally:
                self._websocket = None

        logger.info("Disconnected from Chatwoot WebSocket")
        await self._emit_event("disconnected", {})

    async def _reconnect(self) -> None:
        """Attempt to reconnect to the WebSocket."""
        retry_count = 0
        max_retries = 10

        while self._should_reconnect and retry_count < max_retries:
            retry_count += 1
            wait_time = min(30, 2 ** retry_count)

            logger.info(
                f"Attempting reconnect {retry_count}/{max_retries} in {wait_time}s"
            )
            await asyncio.sleep(wait_time)

            try:
                await self.connect()
                return  # Success
            except Exception as e:
                logger.warning(f"Reconnect attempt {retry_count} failed: {e}")

        logger.error("Max reconnection attempts reached")
        await self._emit_event("reconnect_failed", {"attempts": retry_count})

    async def listen(self) -> AsyncGenerator[WebSocketEvent, None]:
        """Listen for WebSocket messages and yield events."""
        if not self._websocket:
            raise ChatwootWebSocketError("WebSocket not connected")

        try:
            async for message in self._websocket:
                try:
                    data = json.loads(message)
                    event = self._parse_websocket_message(data)

                    if event:
                        await self._emit_event(event.event_type, event.model_dump())
                        yield event

                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse WebSocket message: {e}")
                except Exception as e:
                    logger.error(f"Error processing WebSocket message: {e}")

        except ConnectionClosed as e:
            logger.warning(f"WebSocket connection closed: {e}")
            self._connected = False

            if self._should_reconnect:
                self._reconnect_task = asyncio.create_task(self._reconnect())

            await self._emit_event("connection_closed", {"code": e.code})

        except WebSocketException as e:
            logger.error(f"WebSocket error: {e}")
            self._connected = False
            raise ChatwootWebSocketError(f"WebSocket error: {e}")

    def _parse_websocket_message(
        self, data: Dict[str, Any]
    ) -> Optional[WebSocketEvent]:
        """Parse a WebSocket message into an event."""
        # Handle ActionCable message format
        if "type" in data:
            msg_type = data["type"]

            if msg_type == "ping":
                return None  # Ignore pings
            elif msg_type == "welcome":
                return WebSocketEvent(
                    event_type="welcome",
                    data=data,
                    timestamp=datetime.now(),
                )
            elif msg_type == "confirm_subscription":
                return WebSocketEvent(
                    event_type="subscribed",
                    data=data,
                    timestamp=datetime.now(),
                )

        # Handle actual message data
        if "message" in data:
            message = data["message"]
            event_type = message.get("event", "unknown")

            return WebSocketEvent(
                event_type=event_type,
                data=message.get("data", message),
                account_id=message.get("account_id"),
                conversation_id=message.get("conversation", {}).get("id"),
                timestamp=datetime.now(),
            )

        return None


# ============================================================================
# Main Chatwoot Client
# ============================================================================

class ChatwootClient(ChatwootHTTPClient):
    """
    Main Chatwoot client for API interactions.

    Provides methods for:
    - Conversations: list, get, create, update, assign
    - Messages: list, create
    - Contacts: list, get, create, update, search
    - Agents: list, get
    - Reports: summary
    - WebSocket: real-time updates

    Usage:
        client = ChatwootClient()

        # List conversations
        conversations = await client.list_conversations()

        # Send a message
        await client.send_message(conversation_id=123, content="Hello!")

        # Real-time updates
        async for event in client.websocket.listen():
            print(event)
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        account_id: Optional[int] = None,
        **kwargs: Any,
    ):
        config = ChatwootConfig(
            base_url=base_url,
            api_key=api_key,
            account_id=account_id,
            **kwargs,
        )
        super().__init__(config)
        self._websocket_client: Optional[ChatwootWebSocketClient] = None

    @property
    def websocket(self) -> ChatwootWebSocketClient:
        """Get the WebSocket client instance."""
        if self._websocket_client is None:
            self._websocket_client = ChatwootWebSocketClient(self.config)
        return self._websocket_client

    @property
    def is_configured(self) -> bool:
        """Check if the client is properly configured."""
        return self.config.is_configured

    async def close(self) -> None:
        """Close all client connections."""
        await super().close()
        if self._websocket_client:
            await self._websocket_client.disconnect()

    # ========================================================================
    # Conversation Methods
    # ========================================================================

    async def list_conversations(
        self,
        status: Optional[ConversationStatus] = None,
        assignee_type: Optional[str] = None,
        inbox_id: Optional[int] = None,
        team_id: Optional[int] = None,
        labels: Optional[List[str]] = None,
        page: int = 1,
    ) -> PaginatedConversations:
        """
        List conversations with optional filters.

        Args:
            status: Filter by conversation status
            assignee_type: Filter by assignee type ('me', 'unassigned', 'all')
            inbox_id: Filter by inbox ID
            team_id: Filter by team ID
            labels: Filter by labels
            page: Page number for pagination

        Returns:
            PaginatedConversations with data and meta
        """
        params: Dict[str, Any] = {"page": page}

        if status:
            params["status"] = status.value
        if assignee_type:
            params["assignee_type"] = assignee_type
        if inbox_id:
            params["inbox_id"] = inbox_id
        if team_id:
            params["team_id"] = team_id
        if labels:
            params["labels"] = labels

        response = await self.get(
            "/conversations",
            params=params,
            context="List conversations",
        )

        return PaginatedConversations(
            data=[Conversation(**c) for c in response.get("data", {}).get("payload", [])],
            meta=response.get("data", {}).get("meta"),
        )

    async def get_conversation(
        self, conversation_id: int
    ) -> Conversation:
        """
        Get a specific conversation by ID.

        Args:
            conversation_id: The conversation ID

        Returns:
            Conversation object
        """
        response = await self.get(
            f"/conversations/{conversation_id}",
            context=f"Get conversation {conversation_id}",
        )
        return Conversation(**response)

    async def create_conversation(
        self,
        source_id: str,
        inbox_id: int,
        contact_id: Optional[int] = None,
        status: Optional[ConversationStatus] = None,
        assignee_id: Optional[int] = None,
        team_id: Optional[int] = None,
        additional_attributes: Optional[Dict[str, Any]] = None,
        custom_attributes: Optional[Dict[str, Any]] = None,
    ) -> Conversation:
        """
        Create a new conversation.

        Args:
            source_id: Unique source identifier
            inbox_id: Inbox ID to create conversation in
            contact_id: Optional contact ID
            status: Initial conversation status
            assignee_id: Optional assignee agent ID
            team_id: Optional team ID
            additional_attributes: Additional attributes
            custom_attributes: Custom attributes

        Returns:
            Created Conversation object
        """
        data = ConversationCreate(
            source_id=source_id,
            inbox_id=inbox_id,
            contact_id=contact_id,
            status=status,
            assignee_id=assignee_id,
            team_id=team_id,
            additional_attributes=additional_attributes,
            custom_attributes=custom_attributes,
        )

        response = await self.post(
            "/conversations",
            data=data.model_dump(exclude_none=True),
            context="Create conversation",
        )
        return Conversation(**response)

    async def update_conversation(
        self,
        conversation_id: int,
        status: Optional[ConversationStatus] = None,
        assignee_id: Optional[int] = None,
        team_id: Optional[int] = None,
        labels: Optional[List[str]] = None,
        priority: Optional[str] = None,
        snoozed_until: Optional[int] = None,
    ) -> Conversation:
        """
        Update a conversation.

        Args:
            conversation_id: The conversation ID to update
            status: New status
            assignee_id: New assignee ID
            team_id: New team ID
            labels: New labels
            priority: New priority
            snoozed_until: Snooze until timestamp

        Returns:
            Updated Conversation object
        """
        data = ConversationUpdate(
            status=status,
            assignee_id=assignee_id,
            team_id=team_id,
            labels=labels,
            priority=priority,
            snoozed_until=snoozed_until,
        )

        response = await self.patch(
            f"/conversations/{conversation_id}",
            data=data.model_dump(exclude_none=True),
            context=f"Update conversation {conversation_id}",
        )
        return Conversation(**response)

    async def assign_conversation(
        self,
        conversation_id: int,
        assignee_id: Optional[int] = None,
        team_id: Optional[int] = None,
    ) -> Conversation:
        """
        Assign a conversation to an agent or team.

        Args:
            conversation_id: The conversation ID
            assignee_id: Agent ID to assign to
            team_id: Team ID to assign to

        Returns:
            Updated Conversation object
        """
        data = ConversationAssignment(
            assignee_id=assignee_id,
            team_id=team_id,
        )

        response = await self.post(
            f"/conversations/{conversation_id}/assignments",
            data=data.model_dump(exclude_none=True),
            context=f"Assign conversation {conversation_id}",
        )
        return Conversation(**response)

    async def toggle_conversation_status(
        self,
        conversation_id: int,
        status: ConversationStatus,
    ) -> Conversation:
        """
        Toggle conversation status (open/resolved/pending/snoozed).

        Args:
            conversation_id: The conversation ID
            status: New status

        Returns:
            Updated Conversation object
        """
        response = await self.post(
            f"/conversations/{conversation_id}/toggle_status",
            data={"status": status.value},
            context=f"Toggle status for conversation {conversation_id}",
        )
        return Conversation(**response.get("payload", response))

    async def add_labels_to_conversation(
        self,
        conversation_id: int,
        labels: List[str],
    ) -> Dict[str, Any]:
        """
        Add labels to a conversation.

        Args:
            conversation_id: The conversation ID
            labels: List of label names

        Returns:
            Response with added labels
        """
        return await self.post(
            f"/conversations/{conversation_id}/labels",
            data={"labels": labels},
            context=f"Add labels to conversation {conversation_id}",
        )

    # ========================================================================
    # Message Methods
    # ========================================================================

    async def list_messages(
        self,
        conversation_id: int,
        before: Optional[int] = None,
    ) -> PaginatedMessages:
        """
        List messages in a conversation.

        Args:
            conversation_id: The conversation ID
            before: Get messages before this message ID

        Returns:
            PaginatedMessages with payload and meta
        """
        params = {}
        if before:
            params["before"] = before

        response = await self.get(
            f"/conversations/{conversation_id}/messages",
            params=params,
            context=f"List messages for conversation {conversation_id}",
        )

        return PaginatedMessages(
            payload=[Message(**m) for m in response.get("payload", [])],
            meta=response.get("meta"),
        )

    async def send_message(
        self,
        conversation_id: int,
        content: str,
        message_type: str = "outgoing",
        private: bool = False,
        content_type: str = "text",
        content_attributes: Optional[Dict[str, Any]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        echo_id: Optional[str] = None,
    ) -> Message:
        """
        Send a message to a conversation.

        Args:
            conversation_id: The conversation ID
            content: Message content
            message_type: Type of message ('incoming', 'outgoing')
            private: Whether message is private (internal note)
            content_type: Content type ('text', 'input_text', etc.)
            content_attributes: Additional content attributes
            attachments: List of attachments
            echo_id: Client-side message ID for deduplication

        Returns:
            Created Message object
        """
        data = MessageCreate(
            content=content,
            message_type=message_type,
            private=private,
            content_type=content_type,
            content_attributes=content_attributes,
            attachments=attachments,
            echo_id=echo_id,
        )

        response = await self.post(
            f"/conversations/{conversation_id}/messages",
            data=data.model_dump(exclude_none=True),
            context=f"Send message to conversation {conversation_id}",
        )
        return Message(**response)

    async def delete_message(
        self,
        conversation_id: int,
        message_id: int,
    ) -> Dict[str, Any]:
        """
        Delete a message from a conversation.

        Args:
            conversation_id: The conversation ID
            message_id: The message ID to delete

        Returns:
            Deletion confirmation
        """
        return await self.delete(
            f"/conversations/{conversation_id}/messages/{message_id}",
            context=f"Delete message {message_id}",
        )

    # ========================================================================
    # Contact Methods
    # ========================================================================

    async def list_contacts(
        self,
        page: int = 1,
        sort: Optional[str] = None,
        order: Optional[str] = None,
    ) -> PaginatedContacts:
        """
        List contacts with optional sorting.

        Args:
            page: Page number
            sort: Sort field ('name', 'email', 'phone_number', 'last_activity_at')
            order: Sort order ('asc', 'desc')

        Returns:
            PaginatedContacts with data and meta
        """
        params: Dict[str, Any] = {"page": page}
        if sort:
            params["sort"] = sort
        if order:
            params["order"] = order

        response = await self.get(
            "/contacts",
            params=params,
            context="List contacts",
        )

        return PaginatedContacts(
            data=[Contact(**c) for c in response.get("payload", [])],
            meta=response.get("meta"),
        )

    async def get_contact(self, contact_id: int) -> Contact:
        """
        Get a specific contact by ID.

        Args:
            contact_id: The contact ID

        Returns:
            Contact object
        """
        response = await self.get(
            f"/contacts/{contact_id}",
            context=f"Get contact {contact_id}",
        )
        return Contact(**response.get("payload", response))

    async def create_contact(
        self,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone_number: Optional[str] = None,
        identifier: Optional[str] = None,
        avatar_url: Optional[str] = None,
        custom_attributes: Optional[Dict[str, Any]] = None,
    ) -> Contact:
        """
        Create a new contact.

        Args:
            name: Contact name
            email: Contact email
            phone_number: Contact phone number
            identifier: External identifier
            avatar_url: Avatar URL
            custom_attributes: Custom attributes

        Returns:
            Created Contact object
        """
        data = ContactCreate(
            name=name,
            email=email,
            phone_number=phone_number,
            identifier=identifier,
            avatar_url=avatar_url,
            custom_attributes=custom_attributes,
        )

        response = await self.post(
            "/contacts",
            data=data.model_dump(exclude_none=True),
            context="Create contact",
        )
        return Contact(**response.get("payload", response))

    async def update_contact(
        self,
        contact_id: int,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone_number: Optional[str] = None,
        identifier: Optional[str] = None,
        avatar_url: Optional[str] = None,
        custom_attributes: Optional[Dict[str, Any]] = None,
    ) -> Contact:
        """
        Update a contact.

        Args:
            contact_id: The contact ID
            name: Updated name
            email: Updated email
            phone_number: Updated phone number
            identifier: Updated identifier
            avatar_url: Updated avatar URL
            custom_attributes: Updated custom attributes

        Returns:
            Updated Contact object
        """
        data = ContactUpdate(
            name=name,
            email=email,
            phone_number=phone_number,
            identifier=identifier,
            avatar_url=avatar_url,
            custom_attributes=custom_attributes,
        )

        response = await self.put(
            f"/contacts/{contact_id}",
            data=data.model_dump(exclude_none=True),
            context=f"Update contact {contact_id}",
        )
        return Contact(**response.get("payload", response))

    async def search_contacts(
        self,
        query: str,
        page: int = 1,
    ) -> PaginatedContacts:
        """
        Search contacts by query.

        Args:
            query: Search query string
            page: Page number

        Returns:
            PaginatedContacts with matching contacts
        """
        response = await self.get(
            "/contacts/search",
            params={"q": query, "page": page},
            context=f"Search contacts: {query}",
        )

        return PaginatedContacts(
            data=[Contact(**c) for c in response.get("payload", [])],
            meta=response.get("meta"),
        )

    async def get_contact_conversations(
        self,
        contact_id: int,
    ) -> List[Conversation]:
        """
        Get all conversations for a contact.

        Args:
            contact_id: The contact ID

        Returns:
            List of Conversation objects
        """
        response = await self.get(
            f"/contacts/{contact_id}/conversations",
            context=f"Get conversations for contact {contact_id}",
        )
        return [Conversation(**c) for c in response.get("payload", [])]

    # ========================================================================
    # Agent Methods
    # ========================================================================

    async def list_agents(self) -> List[Agent]:
        """
        List all agents in the account.

        Returns:
            List of Agent objects
        """
        response = await self.get("/agents", context="List agents")
        return [Agent(**a) for a in response]

    async def get_agent(self, agent_id: int) -> Agent:
        """
        Get a specific agent by ID.

        Args:
            agent_id: The agent ID

        Returns:
            Agent object
        """
        response = await self.get(
            f"/agents/{agent_id}",
            context=f"Get agent {agent_id}",
        )
        return Agent(**response)

    # ========================================================================
    # Report Methods
    # ========================================================================

    async def get_report_summary(
        self,
        report_type: str = "account",
        since: Optional[int] = None,
        until: Optional[int] = None,
        business_hours: bool = False,
    ) -> ReportSummary:
        """
        Get report summary statistics.

        Args:
            report_type: Type of report ('account', 'agent', 'inbox', 'label', 'team')
            since: Start timestamp (Unix epoch)
            until: End timestamp (Unix epoch)
            business_hours: Calculate based on business hours

        Returns:
            ReportSummary with statistics
        """
        params: Dict[str, Any] = {"type": report_type}
        if since:
            params["since"] = since
        if until:
            params["until"] = until
        if business_hours:
            params["business_hours"] = business_hours

        response = await self.get(
            "/reports/summary",
            params=params,
            context="Get report summary",
        )
        return ReportSummary(**response)

    # ========================================================================
    # Inbox Methods
    # ========================================================================

    async def list_inboxes(self) -> List[Dict[str, Any]]:
        """
        List all inboxes in the account.

        Returns:
            List of inbox dictionaries
        """
        response = await self.get("/inboxes", context="List inboxes")
        return response.get("payload", response)

    async def get_inbox(self, inbox_id: int) -> Dict[str, Any]:
        """
        Get a specific inbox by ID.

        Args:
            inbox_id: The inbox ID

        Returns:
            Inbox data dictionary
        """
        return await self.get(
            f"/inboxes/{inbox_id}",
            context=f"Get inbox {inbox_id}",
        )

    # ========================================================================
    # Team Methods
    # ========================================================================

    async def list_teams(self) -> List[Dict[str, Any]]:
        """
        List all teams in the account.

        Returns:
            List of team dictionaries
        """
        response = await self.get("/teams", context="List teams")
        return response

    # ========================================================================
    # Label Methods
    # ========================================================================

    async def list_labels(self) -> List[Dict[str, Any]]:
        """
        List all labels in the account.

        Returns:
            List of label dictionaries
        """
        response = await self.get("/labels", context="List labels")
        return response.get("payload", response)

    async def create_label(
        self,
        title: str,
        description: Optional[str] = None,
        color: Optional[str] = None,
        show_on_sidebar: bool = True,
    ) -> Dict[str, Any]:
        """
        Create a new label.

        Args:
            title: Label title
            description: Label description
            color: Label color (hex)
            show_on_sidebar: Show label on sidebar

        Returns:
            Created label data
        """
        data = {
            "title": title,
            "show_on_sidebar": show_on_sidebar,
        }
        if description:
            data["description"] = description
        if color:
            data["color"] = color

        return await self.post("/labels", data=data, context="Create label")


# ============================================================================
# Singleton Instance
# ============================================================================

# Create a singleton instance for easy import
chatwoot_client = ChatwootClient()


# ============================================================================
# Context Manager
# ============================================================================

@asynccontextmanager
async def get_chatwoot_client(
    base_url: Optional[str] = None,
    api_key: Optional[str] = None,
    account_id: Optional[int] = None,
) -> AsyncGenerator[ChatwootClient, None]:
    """
    Context manager for creating a Chatwoot client.

    Usage:
        async with get_chatwoot_client() as client:
            conversations = await client.list_conversations()
    """
    client = ChatwootClient(
        base_url=base_url,
        api_key=api_key,
        account_id=account_id,
    )
    try:
        yield client
    finally:
        await client.close()
