"""
BFF (Backend-for-Frontend) Router for Kupuri Studios Internal Dashboard.

This router provides the API layer for the BFF pattern:
- /api/bff/queue - Get unified queue view
- /api/bff/case/:id - Get case with full context
- /api/bff/assign - Assign case to operator
- /api/bff/macro/execute - Execute macro template
- /api/bff/sla/status - Get SLA status for cases
- /api/bff/analytics - Get operator analytics

Additional endpoints:
- /api/bff/session/init - Initialize operator session
- /api/bff/session/end - End operator session
- /api/bff/tool/execute - Execute tool chain
- /api/bff/context/ai - Get AI context for agent operations
"""

import logging
import traceback
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Path, Query, Request, status
from fastapi.responses import JSONResponse

from models.bff_models import (
    AnalyticsRequest,
    AnalyticsResponse,
    AssignmentRequest,
    AssignmentResponse,
    BFFError,
    BFFErrorResponse,
    CaseDetailContext,
    CaseRequest,
    CaseResponse,
    MacroExecuteRequest,
    MacroExecuteResponse,
    OperatorContext,
    OperatorRole,
    QueueRequest,
    QueueResponse,
    SLAStatusRequest,
    SLAStatusResponse,
    ToolExecutionRequest,
    ToolExecutionResponse,
    BaseResponseModel,
)
from services.bff_service import bff_service

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(handler)

# Create router with prefix
router = APIRouter(prefix="/api/bff", tags=["BFF - Backend for Frontend"])


# ============================================================================
# Error Handling
# ============================================================================

def create_error_response(
    error_code: str,
    error_message: str,
    field: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JSONResponse:
    """Create a standardized error response."""
    error = BFFError(
        error_code=error_code,
        error_message=error_message,
        field=field,
        details=details,
    )
    response = BFFErrorResponse(errors=[error])
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(mode="json"),
    )


async def handle_request(func, error_context: str = "operation"):
    """Wrapper to handle common error patterns."""
    try:
        return await func()
    except ValueError as e:
        logger.warning(f"Validation error in {error_context}: {str(e)}")
        return create_error_response(
            error_code="VALIDATION_ERROR",
            error_message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except PermissionError as e:
        logger.warning(f"Permission denied in {error_context}: {str(e)}")
        return create_error_response(
            error_code="PERMISSION_DENIED",
            error_message=str(e),
            status_code=status.HTTP_403_FORBIDDEN,
        )
    except Exception as e:
        logger.error(f"Unexpected error in {error_context}: {str(e)}")
        traceback.print_exc()
        return create_error_response(
            error_code="INTERNAL_ERROR",
            error_message="An unexpected error occurred",
            details={"error_type": type(e).__name__},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================================
# Session Management Endpoints
# ============================================================================

class SessionInitRequest(BaseResponseModel):
    """Request model for session initialization."""
    operator_id: str
    operator_name: str
    role: str
    team_id: Optional[str] = None
    team_name: Optional[str] = None


class SessionInitResponse(BaseResponseModel):
    """Response model for session initialization."""
    session_id: str
    context: OperatorContext


@router.post(
    "/session/init",
    response_model=SessionInitResponse,
    summary="Initialize operator session",
    description="Initialize a new operator session with context and secrets management.",
)
async def init_session(request: Request):
    """
    Initialize a new operator session.

    This endpoint creates a new session with:
    - Secure secret management (API keys, tokens)
    - Operator context with permissions
    - Session tracking for audit
    """
    async def _init():
        data = await request.json()

        operator_id = data.get("operator_id")
        operator_name = data.get("operator_name")
        role_str = data.get("role", "agent")
        team_id = data.get("team_id")
        team_name = data.get("team_name")

        if not operator_id or not operator_name:
            raise ValueError("operator_id and operator_name are required")

        # Parse role
        try:
            role = OperatorRole(role_str.lower())
        except ValueError:
            role = OperatorRole.AGENT

        # Generate session ID
        import uuid
        session_id = str(uuid.uuid4())

        # Initialize session
        context = bff_service.initialize_session(
            operator_id=operator_id,
            operator_name=operator_name,
            role=role,
            session_id=session_id,
            team_id=team_id,
            team_name=team_name,
        )

        logger.info(f"Session initialized: {session_id[:8]}... for operator {operator_name}")

        return SessionInitResponse(
            success=True,
            message="Session initialized successfully",
            session_id=session_id,
            context=context,
        )

    return await handle_request(_init, "session initialization")


@router.post(
    "/session/end",
    response_model=BaseResponseModel,
    summary="End operator session",
    description="End an operator session and cleanup resources.",
)
async def end_session(request: Request):
    """
    End an operator session.

    This endpoint:
    - Revokes all session secrets
    - Invalidates operator context
    - Cleans up session resources
    """
    async def _end():
        data = await request.json()
        session_id = data.get("session_id")

        if not session_id:
            raise ValueError("session_id is required")

        bff_service.end_session(session_id)

        logger.info(f"Session ended: {session_id[:8]}...")

        return BaseResponseModel(
            success=True,
            message="Session ended successfully",
        )

    return await handle_request(_end, "session end")


# ============================================================================
# Queue Endpoints
# ============================================================================

@router.post(
    "/queue",
    response_model=QueueResponse,
    summary="Get unified queue view",
    description="Get a filtered and paginated queue of cases for the operator dashboard.",
)
async def get_queue(request: QueueRequest):
    """
    Get unified queue view with filters and pagination.

    Supports filtering by:
    - Status (new, open, in_progress, etc.)
    - Priority (low, medium, high, urgent, critical)
    - Channel (web, email, chat, phone)
    - Assignment (my queue, team queue, unassigned)
    - SLA status (on_track, at_risk, breached)
    - Search query
    - Date range

    Returns paginated results with queue statistics.
    """
    async def _get_queue():
        # Validate session
        if not bff_service.validate_session(request.session_id, request.operator_id):
            raise ValueError("Invalid or expired session")

        cases, total_count, stats = await bff_service.get_queue(request)

        total_pages = (total_count + request.pagination.page_size - 1) // request.pagination.page_size

        logger.info(
            f"Queue retrieved: {len(cases)} cases (page {request.pagination.page}/{total_pages}) "
            f"for operator {request.operator_id}"
        )

        return QueueResponse(
            success=True,
            cases=cases,
            stats=stats,
            total_count=total_count,
            page=request.pagination.page,
            page_size=request.pagination.page_size,
            total_pages=total_pages,
        )

    return await handle_request(_get_queue, "queue retrieval")


# ============================================================================
# Case Endpoints
# ============================================================================

@router.post(
    "/case/{case_id}",
    response_model=CaseResponse,
    summary="Get case with full context",
    description="Get a case with full context including messages, history, and AI insights.",
)
async def get_case(
    case_id: str = Path(..., description="Case identifier"),
    request: CaseRequest = ...,
):
    """
    Get case with full context.

    Returns:
    - Full case details
    - Message thread
    - Activity history
    - Related cases
    - Customer history (optional)
    - AI summary and suggestions
    - Available macros and actions
    """
    async def _get_case():
        # Validate session
        if not bff_service.validate_session(request.session_id, request.operator_id):
            raise ValueError("Invalid or expired session")

        context = await bff_service.get_case(case_id, request)

        if not context:
            raise ValueError(f"Case not found: {case_id}")

        logger.info(f"Case {case_id} retrieved for operator {request.operator_id}")

        return CaseResponse(
            success=True,
            message="Case retrieved successfully",
            data=context,
        )

    return await handle_request(_get_case, "case retrieval")


# ============================================================================
# Assignment Endpoints
# ============================================================================

@router.post(
    "/assign",
    response_model=AssignmentResponse,
    summary="Assign case to operator",
    description="Assign a case to an operator or team with optional priority override.",
)
async def assign_case(request: AssignmentRequest):
    """
    Assign a case to an operator or team.

    Supports:
    - Self-assignment
    - Team assignment (requires permission)
    - Priority override (requires permission)
    - Assignment notes

    Automatically updates SLA tracking and activity history.
    """
    async def _assign():
        # Validate session
        if not bff_service.validate_session(request.session_id, request.operator_id):
            raise ValueError("Invalid or expired session")

        result = await bff_service.assign_case(request)

        logger.info(
            f"Case {request.case_id} assigned: {result.previous_operator_id} -> {result.new_operator_id}"
        )

        return AssignmentResponse(
            success=True,
            message="Case assigned successfully",
            data=result,
        )

    return await handle_request(_assign, "case assignment")


# ============================================================================
# Macro Endpoints
# ============================================================================

@router.post(
    "/macro/execute",
    response_model=MacroExecuteResponse,
    summary="Execute macro template",
    description="Execute a macro template for a case with variable substitution and actions.",
)
async def execute_macro(request: MacroExecuteRequest):
    """
    Execute a macro template for a case.

    Features:
    - Variable substitution (customer name, case number, etc.)
    - Multi-step action execution
    - Preview mode (render without executing)
    - Immediate send option

    Actions may include:
    - Status changes
    - Team assignment
    - Survey triggers
    - Custom actions
    """
    async def _execute():
        # Validate session
        if not bff_service.validate_session(request.session_id, request.operator_id):
            raise ValueError("Invalid or expired session")

        result = await bff_service.execute_macro(request)

        logger.info(
            f"Macro {request.macro_id} executed for case {request.case_id} "
            f"(preview={request.preview_only}, sent={result.was_sent})"
        )

        return MacroExecuteResponse(
            success=True,
            message="Macro executed successfully" if not request.preview_only else "Macro preview generated",
            data=result,
        )

    return await handle_request(_execute, "macro execution")


@router.get(
    "/macro/list",
    summary="List available macros",
    description="Get list of available macro templates for the current operator.",
)
async def list_macros(
    session_id: str = Query(..., description="Session identifier"),
    operator_id: str = Query(..., description="Operator identifier"),
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """
    List available macro templates.

    Returns macros filtered by:
    - Operator permissions
    - Optional category filter
    """
    async def _list():
        # Validate session
        if not bff_service.validate_session(session_id, operator_id):
            raise ValueError("Invalid or expired session")

        # Get all macros from data aggregator
        macros = list(bff_service.data_aggregator._macros.values())

        if category:
            macros = [m for m in macros if m.category == category]

        # Filter by permissions
        context = bff_service.get_operator_context(session_id)
        if context:
            macros = [
                m for m in macros
                if all(perm in context.permissions for perm in m.required_permissions)
            ]

        return {
            "success": True,
            "macros": [m.model_dump(mode="json") for m in macros],
            "total_count": len(macros),
        }

    return await handle_request(_list, "macro listing")


# ============================================================================
# SLA Endpoints
# ============================================================================

@router.post(
    "/sla/status",
    response_model=SLAStatusResponse,
    summary="Get SLA status for cases",
    description="Get SLA status and compliance metrics for cases.",
)
async def get_sla_status(request: SLAStatusRequest):
    """
    Get SLA status for cases.

    Returns:
    - Individual case SLA status
    - First response and resolution tracking
    - Time remaining until breach
    - Overall compliance summary

    Supports filtering by:
    - Specific case IDs
    - Team
    - At-risk cases only
    - Include/exclude resolved
    """
    async def _get_status():
        # Validate session
        if not bff_service.validate_session(request.session_id, request.operator_id):
            raise ValueError("Invalid or expired session")

        cases, summary = await bff_service.get_sla_status(request)

        logger.info(
            f"SLA status retrieved: {len(cases)} cases "
            f"(at_risk={summary.at_risk_count}, breached={summary.breached_count})"
        )

        return SLAStatusResponse(
            success=True,
            cases=cases,
            summary=summary,
        )

    return await handle_request(_get_status, "SLA status retrieval")


# ============================================================================
# Analytics Endpoints
# ============================================================================

@router.post(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Get operator analytics",
    description="Get performance analytics and metrics for an operator.",
)
async def get_analytics(request: AnalyticsRequest):
    """
    Get operator analytics and performance metrics.

    Returns:
    - Cases handled and resolved
    - Response and resolution times
    - SLA compliance rate
    - Customer satisfaction scores
    - Volume trends over time
    - Breakdown by channel, priority, status

    Supports:
    - Multiple time ranges (today, 7 days, 30 days, custom)
    - Team comparison (optional)
    - Specific metric selection
    """
    async def _get_analytics():
        # Validate session
        if not bff_service.validate_session(request.session_id, request.operator_id):
            raise ValueError("Invalid or expired session")

        data = await bff_service.get_analytics(request)

        logger.info(
            f"Analytics retrieved for operator {request.operator_id} "
            f"(range={request.time_range.value})"
        )

        return AnalyticsResponse(
            success=True,
            message="Analytics retrieved successfully",
            data=data,
        )

    return await handle_request(_get_analytics, "analytics retrieval")


# ============================================================================
# Tool Orchestration Endpoints
# ============================================================================

@router.post(
    "/tool/execute",
    response_model=ToolExecutionResponse,
    summary="Execute tool or tool chain",
    description="Execute a single tool or orchestrated tool chain.",
)
async def execute_tool(request: ToolExecutionRequest):
    """
    Execute a tool or tool chain.

    Supports:
    - Single tool execution
    - Multi-step tool chains
    - Context passing between steps
    - Error handling (stop, continue, retry)

    Tools have secure access to:
    - Session API keys (server-side only)
    - Operator context
    - Case context (if provided)
    """
    async def _execute():
        # Validate session
        if not bff_service.validate_session(request.session_id, request.operator_id):
            raise ValueError("Invalid or expired session")

        result = await bff_service.execute_tool(request)

        logger.info(
            f"Tool executed: tool_id={request.tool_id}, chain_id={request.chain_id}, "
            f"status={result.status}, time={result.execution_time_ms}ms"
        )

        return ToolExecutionResponse(
            success=True,
            message=f"Tool execution completed with status: {result.status}",
            data=result,
        )

    return await handle_request(_execute, "tool execution")


@router.get(
    "/tool/list",
    summary="List available tools",
    description="Get list of available tools for orchestration.",
)
async def list_tools(
    session_id: str = Query(..., description="Session identifier"),
    operator_id: str = Query(..., description="Operator identifier"),
):
    """
    List available tools for orchestration.

    Returns tool definitions with:
    - Input/output schemas
    - Required permissions
    - Timeout settings
    """
    async def _list():
        # Validate session
        if not bff_service.validate_session(session_id, operator_id):
            raise ValueError("Invalid or expired session")

        tools = list(bff_service.tool_orchestrator._tools.values())

        return {
            "success": True,
            "tools": [t.model_dump(mode="json") for t in tools],
            "total_count": len(tools),
        }

    return await handle_request(_list, "tool listing")


# ============================================================================
# AI Context Endpoints
# ============================================================================

@router.get(
    "/context/ai",
    summary="Get AI context",
    description="Get enriched context for AI agent operations.",
)
async def get_ai_context(
    session_id: str = Query(..., description="Session identifier"),
    operator_id: str = Query(..., description="Operator identifier"),
    case_id: Optional[str] = Query(None, description="Optional case identifier"),
):
    """
    Get AI context for agent operations.

    Returns enriched context including:
    - Operator information and capabilities
    - Session metadata
    - Case context (if provided)
    - Relevant permissions and constraints

    This context is designed to be injected into AI prompts
    for context-aware responses.
    """
    async def _get_context():
        # Validate session
        if not bff_service.validate_session(session_id, operator_id):
            raise ValueError("Invalid or expired session")

        context = bff_service.get_ai_context(session_id, case_id)

        return {
            "success": True,
            "context": context,
            "timestamp": datetime.utcnow().isoformat(),
        }

    return await handle_request(_get_context, "AI context retrieval")


# ============================================================================
# Health Check
# ============================================================================

@router.get(
    "/health",
    summary="BFF health check",
    description="Check the health status of the BFF service.",
)
async def health_check():
    """
    Check BFF service health.

    Returns:
    - Service status
    - Component status (secrets, context, data)
    - Timestamp
    """
    return {
        "status": "healthy",
        "service": "bff",
        "components": {
            "secret_manager": "healthy",
            "context_injector": "healthy",
            "data_aggregator": "healthy",
            "macro_engine": "healthy",
            "sla_monitor": "healthy",
            "analytics_engine": "healthy",
            "tool_orchestrator": "healthy",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============================================================================
# WebSocket Support
# ============================================================================

# Note: WebSocket handlers are implemented separately in websocket_router.py
# The BFF service provides real-time event emission through the following pattern:
#
# from services.websocket_state import sio
#
# async def emit_case_update(session_id: str, case_id: str, update_type: str):
#     await sio.emit('case_update', {
#         'case_id': case_id,
#         'update_type': update_type,
#         'timestamp': datetime.utcnow().isoformat(),
#     }, room=session_id)
#
# async def emit_sla_alert(session_id: str, case_id: str, alert_type: str, time_remaining: int):
#     await sio.emit('sla_alert', {
#         'case_id': case_id,
#         'alert_type': alert_type,
#         'time_remaining_minutes': time_remaining,
#         'timestamp': datetime.utcnow().isoformat(),
#     }, room=session_id)


logger.info("BFF Router initialized with all endpoints")
