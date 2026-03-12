"""
BFF (Backend-for-Frontend) Models for Kupuri Studios Internal Dashboard.

This module defines all Pydantic models for request/response validation
in the BFF layer. The BFF pattern provides a dedicated API layer that:
- Aggregates data from multiple services
- Handles authentication/authorization
- Manages secrets securely (never exposed to frontend)
- Provides context injection for AI agents
- Orchestrates tool chaining operations
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator


# ============================================================================
# Enums
# ============================================================================

class CaseStatus(str, Enum):
    """Status of a support case."""
    NEW = "new"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING_CUSTOMER = "pending_customer"
    PENDING_INTERNAL = "pending_internal"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"


class CasePriority(str, Enum):
    """Priority level of a support case."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"


class SLAStatus(str, Enum):
    """SLA status for a case."""
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BREACHED = "breached"
    PAUSED = "paused"


class MacroType(str, Enum):
    """Type of macro template."""
    RESPONSE = "response"
    ACTION = "action"
    WORKFLOW = "workflow"
    ESCALATION = "escalation"


class OperatorRole(str, Enum):
    """Role of an operator."""
    AGENT = "agent"
    SENIOR_AGENT = "senior_agent"
    TEAM_LEAD = "team_lead"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"


# ============================================================================
# Base Models
# ============================================================================

class BaseResponseModel(BaseModel):
    """Base model for all BFF responses."""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PaginationParams(BaseModel):
    """Pagination parameters for list requests."""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class PaginatedResponse(BaseResponseModel):
    """Base model for paginated responses."""
    total_count: int
    page: int
    page_size: int
    total_pages: int


# ============================================================================
# Operator Context Models
# ============================================================================

class OperatorContext(BaseModel):
    """Context information for the current operator session."""
    operator_id: str
    operator_name: str
    role: OperatorRole
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    session_id: str
    session_start: datetime
    active_cases: int = 0
    max_concurrent_cases: int = 10


class SessionSecrets(BaseModel):
    """
    Server-side only secrets for a session.
    NEVER expose this model to the frontend.
    """
    api_keys: Dict[str, str] = Field(default_factory=dict)
    auth_tokens: Dict[str, str] = Field(default_factory=dict)
    encryption_keys: Dict[str, str] = Field(default_factory=dict)

    class Config:
        # Prevent accidental serialization
        json_encoders = {
            str: lambda v: "[REDACTED]" if v else None
        }


# ============================================================================
# Case Models
# ============================================================================

class CustomerInfo(BaseModel):
    """Customer information for a case."""
    customer_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    tier: Optional[str] = Field(default="standard", description="Customer tier: standard, premium, enterprise")
    lifetime_value: Optional[float] = None
    previous_cases_count: int = 0
    satisfaction_score: Optional[float] = None


class CaseMessage(BaseModel):
    """A message in a case thread."""
    message_id: str
    case_id: str
    sender_type: str = Field(description="customer, operator, system, ai")
    sender_id: str
    sender_name: str
    content: str
    content_type: str = Field(default="text", description="text, html, markdown")
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    is_internal: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CaseSLAInfo(BaseModel):
    """SLA information for a case."""
    sla_policy_id: str
    sla_policy_name: str
    first_response_target: Optional[datetime] = None
    first_response_actual: Optional[datetime] = None
    first_response_status: SLAStatus = SLAStatus.ON_TRACK
    resolution_target: Optional[datetime] = None
    resolution_actual: Optional[datetime] = None
    resolution_status: SLAStatus = SLAStatus.ON_TRACK
    time_to_first_response_minutes: Optional[int] = None
    time_to_resolution_minutes: Optional[int] = None
    breach_count: int = 0


class CaseTag(BaseModel):
    """Tag attached to a case."""
    tag_id: str
    name: str
    color: Optional[str] = None
    category: Optional[str] = None


class Case(BaseModel):
    """Full case model with all context."""
    case_id: str
    case_number: str
    subject: str
    description: Optional[str] = None
    status: CaseStatus = CaseStatus.NEW
    priority: CasePriority = CasePriority.MEDIUM
    channel: str = Field(default="web", description="Source channel: web, email, chat, phone, api")

    # Relationships
    customer: CustomerInfo
    assigned_operator_id: Optional[str] = None
    assigned_operator_name: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    # Context
    messages: List[CaseMessage] = Field(default_factory=list)
    sla: Optional[CaseSLAInfo] = None
    tags: List[CaseTag] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

    # AI Context
    ai_summary: Optional[str] = None
    ai_suggested_responses: List[str] = Field(default_factory=list)
    ai_sentiment: Optional[str] = None
    ai_category: Optional[str] = None

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CaseSummary(BaseModel):
    """Lightweight case summary for queue views."""
    case_id: str
    case_number: str
    subject: str
    status: CaseStatus
    priority: CasePriority
    channel: str
    customer_name: str
    customer_tier: Optional[str] = None
    assigned_operator_name: Optional[str] = None
    sla_status: SLAStatus = SLAStatus.ON_TRACK
    sla_breach_risk: bool = False
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    tags: List[str] = Field(default_factory=list)


# ============================================================================
# Queue Models
# ============================================================================

class QueueFilter(BaseModel):
    """Filters for queue view."""
    status: Optional[List[CaseStatus]] = None
    priority: Optional[List[CasePriority]] = None
    channel: Optional[List[str]] = None
    assigned_operator_id: Optional[str] = None
    team_id: Optional[str] = None
    sla_status: Optional[List[SLAStatus]] = None
    tags: Optional[List[str]] = None
    customer_tier: Optional[List[str]] = None
    search_query: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    unassigned_only: bool = False


class QueueRequest(BaseModel):
    """Request model for queue endpoint."""
    operator_id: str
    session_id: str
    filters: Optional[QueueFilter] = None
    pagination: PaginationParams = Field(default_factory=PaginationParams)
    view_type: str = Field(default="my_queue", description="my_queue, team_queue, all_open, unassigned")


class QueueStats(BaseModel):
    """Statistics for a queue view."""
    total_cases: int = 0
    new_cases: int = 0
    open_cases: int = 0
    pending_cases: int = 0
    escalated_cases: int = 0
    sla_at_risk: int = 0
    sla_breached: int = 0
    avg_response_time_minutes: Optional[float] = None
    avg_resolution_time_minutes: Optional[float] = None


class QueueResponse(PaginatedResponse):
    """Response model for queue endpoint."""
    cases: List[CaseSummary]
    stats: QueueStats


# ============================================================================
# Case Detail Models
# ============================================================================

class CaseRequest(BaseModel):
    """Request model for case detail endpoint."""
    operator_id: str
    session_id: str
    include_messages: bool = True
    include_ai_context: bool = True
    include_customer_history: bool = False
    message_limit: int = Field(default=50, ge=1, le=200)


class CaseHistoryItem(BaseModel):
    """Item in case activity history."""
    event_id: str
    event_type: str = Field(description="created, updated, assigned, status_changed, message_sent, etc.")
    description: str
    actor_type: str = Field(description="operator, customer, system, ai")
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RelatedCase(BaseModel):
    """Related case summary."""
    case_id: str
    case_number: str
    subject: str
    status: CaseStatus
    relation_type: str = Field(description="same_customer, similar_issue, linked, duplicate")
    created_at: datetime


class CaseDetailContext(BaseModel):
    """Extended context for case detail view."""
    case: Case
    history: List[CaseHistoryItem] = Field(default_factory=list)
    related_cases: List[RelatedCase] = Field(default_factory=list)
    customer_previous_cases: List[CaseSummary] = Field(default_factory=list)
    available_macros: List[str] = Field(default_factory=list)
    available_actions: List[str] = Field(default_factory=list)


class CaseResponse(BaseResponseModel):
    """Response model for case detail endpoint."""
    data: CaseDetailContext


# ============================================================================
# Assignment Models
# ============================================================================

class AssignmentRequest(BaseModel):
    """Request model for case assignment."""
    operator_id: str
    session_id: str
    case_id: str
    target_operator_id: Optional[str] = None
    target_team_id: Optional[str] = None
    assignment_type: str = Field(default="manual", description="manual, auto, round_robin, skill_based")
    priority_override: Optional[CasePriority] = None
    notes: Optional[str] = None


class AssignmentResult(BaseModel):
    """Result of an assignment operation."""
    case_id: str
    previous_operator_id: Optional[str] = None
    new_operator_id: Optional[str] = None
    previous_team_id: Optional[str] = None
    new_team_id: Optional[str] = None
    assignment_type: str
    assigned_at: datetime


class AssignmentResponse(BaseResponseModel):
    """Response model for assignment endpoint."""
    data: AssignmentResult


# ============================================================================
# Macro Models
# ============================================================================

class MacroVariable(BaseModel):
    """Variable in a macro template."""
    name: str
    type: str = Field(default="string", description="string, number, boolean, select, date")
    required: bool = False
    default_value: Optional[Any] = None
    options: Optional[List[str]] = None
    description: Optional[str] = None


class MacroTemplate(BaseModel):
    """Macro template definition."""
    macro_id: str
    name: str
    description: Optional[str] = None
    type: MacroType
    category: Optional[str] = None
    content: str
    variables: List[MacroVariable] = Field(default_factory=list)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    required_permissions: List[str] = Field(default_factory=list)
    is_active: bool = True
    usage_count: int = 0
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MacroExecuteRequest(BaseModel):
    """Request model for macro execution."""
    operator_id: str
    session_id: str
    case_id: str
    macro_id: str
    variables: Dict[str, Any] = Field(default_factory=dict)
    preview_only: bool = False
    send_immediately: bool = False


class MacroExecutionStep(BaseModel):
    """A step in macro execution."""
    step_number: int
    action: str
    status: str = Field(description="pending, completed, failed, skipped")
    result: Optional[str] = None
    error: Optional[str] = None
    executed_at: Optional[datetime] = None


class MacroExecutionResult(BaseModel):
    """Result of macro execution."""
    execution_id: str
    macro_id: str
    case_id: str
    rendered_content: str
    steps: List[MacroExecutionStep] = Field(default_factory=list)
    was_sent: bool = False
    execution_time_ms: int = 0
    executed_at: datetime


class MacroExecuteResponse(BaseResponseModel):
    """Response model for macro execution endpoint."""
    data: MacroExecutionResult


# ============================================================================
# SLA Models
# ============================================================================

class SLAPolicy(BaseModel):
    """SLA policy definition."""
    policy_id: str
    name: str
    description: Optional[str] = None
    priority: CasePriority
    first_response_minutes: int
    resolution_minutes: int
    escalation_rules: List[Dict[str, Any]] = Field(default_factory=list)
    business_hours_only: bool = True
    is_active: bool = True


class SLACaseStatus(BaseModel):
    """SLA status for a specific case."""
    case_id: str
    case_number: str
    subject: str
    priority: CasePriority
    sla_policy_name: str
    first_response: CaseSLAInfo
    resolution: CaseSLAInfo
    overall_status: SLAStatus
    time_remaining_minutes: Optional[int] = None
    breach_predicted_at: Optional[datetime] = None


class SLAStatusRequest(BaseModel):
    """Request model for SLA status endpoint."""
    operator_id: str
    session_id: str
    case_ids: Optional[List[str]] = None
    include_resolved: bool = False
    only_at_risk: bool = False
    team_id: Optional[str] = None


class SLASummary(BaseModel):
    """Summary of SLA performance."""
    total_cases: int = 0
    on_track_count: int = 0
    at_risk_count: int = 0
    breached_count: int = 0
    first_response_compliance_rate: float = 0.0
    resolution_compliance_rate: float = 0.0
    avg_first_response_minutes: Optional[float] = None
    avg_resolution_minutes: Optional[float] = None


class SLAStatusResponse(BaseResponseModel):
    """Response model for SLA status endpoint."""
    cases: List[SLACaseStatus]
    summary: SLASummary


# ============================================================================
# Analytics Models
# ============================================================================

class AnalyticsTimeRange(str, Enum):
    """Time range for analytics."""
    TODAY = "today"
    YESTERDAY = "yesterday"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    CUSTOM = "custom"


class AnalyticsRequest(BaseModel):
    """Request model for analytics endpoint."""
    operator_id: str
    session_id: str
    time_range: AnalyticsTimeRange = AnalyticsTimeRange.LAST_7_DAYS
    custom_start: Optional[datetime] = None
    custom_end: Optional[datetime] = None
    team_id: Optional[str] = None
    include_team_comparison: bool = False
    include_trends: bool = True
    metrics: Optional[List[str]] = None


class OperatorPerformance(BaseModel):
    """Performance metrics for an operator."""
    operator_id: str
    operator_name: str
    cases_handled: int = 0
    cases_resolved: int = 0
    avg_response_time_minutes: Optional[float] = None
    avg_resolution_time_minutes: Optional[float] = None
    sla_compliance_rate: float = 0.0
    customer_satisfaction_score: Optional[float] = None
    messages_sent: int = 0
    escalations: int = 0


class TrendDataPoint(BaseModel):
    """Data point for trend charts."""
    timestamp: datetime
    value: float
    label: Optional[str] = None


class AnalyticsTrends(BaseModel):
    """Trend data for analytics."""
    cases_volume: List[TrendDataPoint] = Field(default_factory=list)
    response_time: List[TrendDataPoint] = Field(default_factory=list)
    resolution_time: List[TrendDataPoint] = Field(default_factory=list)
    satisfaction_score: List[TrendDataPoint] = Field(default_factory=list)


class AnalyticsBreakdown(BaseModel):
    """Breakdown data for analytics."""
    by_channel: Dict[str, int] = Field(default_factory=dict)
    by_priority: Dict[str, int] = Field(default_factory=dict)
    by_status: Dict[str, int] = Field(default_factory=dict)
    by_category: Dict[str, int] = Field(default_factory=dict)


class AnalyticsData(BaseModel):
    """Full analytics data."""
    time_range_start: datetime
    time_range_end: datetime
    operator_performance: OperatorPerformance
    team_average: Optional[OperatorPerformance] = None
    trends: Optional[AnalyticsTrends] = None
    breakdown: AnalyticsBreakdown
    top_tags: List[Dict[str, Any]] = Field(default_factory=list)
    top_macros: List[Dict[str, Any]] = Field(default_factory=list)


class AnalyticsResponse(BaseResponseModel):
    """Response model for analytics endpoint."""
    data: AnalyticsData


# ============================================================================
# Tool Chaining / Orchestration Models
# ============================================================================

class ToolDefinition(BaseModel):
    """Definition of a tool for orchestration."""
    tool_id: str
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    required_permissions: List[str] = Field(default_factory=list)
    timeout_seconds: int = 30
    is_async: bool = False


class ToolChainStep(BaseModel):
    """A step in a tool chain."""
    step_id: str
    tool_id: str
    input_mapping: Dict[str, str] = Field(default_factory=dict)
    output_key: str
    condition: Optional[str] = None
    on_error: str = Field(default="stop", description="stop, continue, retry")
    retry_count: int = 0


class ToolChain(BaseModel):
    """Definition of a tool chain for orchestration."""
    chain_id: str
    name: str
    description: Optional[str] = None
    steps: List[ToolChainStep]
    initial_context: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: int = 300


class ToolExecutionRequest(BaseModel):
    """Request to execute a tool or tool chain."""
    operator_id: str
    session_id: str
    case_id: Optional[str] = None
    tool_id: Optional[str] = None
    chain_id: Optional[str] = None
    input_data: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)


class ToolExecutionResult(BaseModel):
    """Result of tool execution."""
    execution_id: str
    tool_id: Optional[str] = None
    chain_id: Optional[str] = None
    status: str = Field(description="success, partial, failed")
    output: Dict[str, Any] = Field(default_factory=dict)
    steps_completed: List[str] = Field(default_factory=list)
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    execution_time_ms: int = 0
    executed_at: datetime


class ToolExecutionResponse(BaseResponseModel):
    """Response model for tool execution."""
    data: ToolExecutionResult


# ============================================================================
# WebSocket Event Models
# ============================================================================

class WebSocketEvent(BaseModel):
    """Base model for WebSocket events."""
    event_type: str
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = None
    operator_id: Optional[str] = None


class CaseUpdateEvent(WebSocketEvent):
    """Event for case updates."""
    event_type: str = "case_update"
    case_id: str
    update_type: str = Field(description="created, updated, assigned, status_changed, message, resolved")


class SLAAlertEvent(WebSocketEvent):
    """Event for SLA alerts."""
    event_type: str = "sla_alert"
    case_id: str
    alert_type: str = Field(description="approaching_breach, breached, resolved")
    time_remaining_minutes: Optional[int] = None


class NotificationEvent(WebSocketEvent):
    """Event for general notifications."""
    event_type: str = "notification"
    notification_type: str
    title: str
    message: str
    action_url: Optional[str] = None


# ============================================================================
# Error Models
# ============================================================================

class BFFError(BaseModel):
    """Error model for BFF responses."""
    error_code: str
    error_message: str
    field: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class BFFErrorResponse(BaseModel):
    """Error response model."""
    success: bool = False
    errors: List[BFFError]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
