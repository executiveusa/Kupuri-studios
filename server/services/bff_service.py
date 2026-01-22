"""
BFF (Backend-for-Frontend) Service for Kupuri Studios Internal Dashboard.

This service provides the core business logic for the BFF layer:
- Secure secret management (server-side only)
- Context injection for operator sessions
- Data aggregation from multiple services
- Tool chaining orchestration
- SLA monitoring and alerting
- Analytics computation
"""

import asyncio
import hashlib
import logging
import os
import time
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from models.bff_models import (
    AnalyticsBreakdown,
    AnalyticsData,
    AnalyticsTrends,
    AnalyticsRequest,
    AnalyticsTimeRange,
    AssignmentRequest,
    AssignmentResult,
    Case,
    CaseDetailContext,
    CaseHistoryItem,
    CaseMessage,
    CasePriority,
    CaseRequest,
    CaseSLAInfo,
    CaseStatus,
    CaseSummary,
    CaseTag,
    CustomerInfo,
    MacroExecuteRequest,
    MacroExecutionResult,
    MacroExecutionStep,
    MacroTemplate,
    MacroType,
    MacroVariable,
    OperatorContext,
    OperatorPerformance,
    OperatorRole,
    QueueFilter,
    QueueRequest,
    QueueStats,
    RelatedCase,
    SessionSecrets,
    SLACaseStatus,
    SLAPolicy,
    SLAStatus,
    SLAStatusRequest,
    SLASummary,
    ToolChain,
    ToolChainStep,
    ToolDefinition,
    ToolExecutionRequest,
    ToolExecutionResult,
    TrendDataPoint,
)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Add handler if not already present
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(handler)


class SecretManager:
    """
    Secure secret management service.

    Secrets are stored server-side only and NEVER exposed to the frontend.
    This class manages API keys, authentication tokens, and encryption keys
    for operator sessions.
    """

    def __init__(self):
        self._session_secrets: Dict[str, SessionSecrets] = {}
        self._secret_ttl_seconds = 3600  # 1 hour default TTL
        self._cleanup_interval = 300  # Cleanup every 5 minutes
        self._last_cleanup = time.time()

    def _generate_secret_key(self, session_id: str, prefix: str = "secret") -> str:
        """Generate a unique key for secret storage."""
        return hashlib.sha256(f"{prefix}:{session_id}:{uuid.uuid4()}".encode()).hexdigest()[:32]

    def _cleanup_expired_secrets(self) -> None:
        """Remove expired secrets from memory."""
        current_time = time.time()
        if current_time - self._last_cleanup < self._cleanup_interval:
            return

        expired_sessions = []
        for session_id in self._session_secrets:
            # Mark for removal (in production, check actual expiry)
            # This is a simplified version
            pass

        for session_id in expired_sessions:
            self.revoke_session_secrets(session_id)

        self._last_cleanup = current_time

    def initialize_session_secrets(self, session_id: str, operator_id: str) -> None:
        """
        Initialize secrets for a new operator session.

        Args:
            session_id: Unique session identifier
            operator_id: Operator's unique identifier
        """
        self._cleanup_expired_secrets()

        # Create new session secrets
        secrets = SessionSecrets(
            api_keys={
                "internal_api": self._generate_secret_key(session_id, "api"),
            },
            auth_tokens={
                "session_token": self._generate_secret_key(session_id, "auth"),
            },
            encryption_keys={
                "data_key": self._generate_secret_key(session_id, "enc"),
            }
        )

        self._session_secrets[session_id] = secrets
        logger.info(f"Initialized secrets for session {session_id[:8]}... (operator: {operator_id})")

    def get_session_secrets(self, session_id: str) -> Optional[SessionSecrets]:
        """
        Retrieve secrets for a session.

        Args:
            session_id: Session identifier

        Returns:
            SessionSecrets if found, None otherwise
        """
        return self._session_secrets.get(session_id)

    def get_api_key(self, session_id: str, key_name: str) -> Optional[str]:
        """
        Get a specific API key for a session.

        Args:
            session_id: Session identifier
            key_name: Name of the API key

        Returns:
            API key value if found, None otherwise
        """
        secrets = self.get_session_secrets(session_id)
        if secrets:
            return secrets.api_keys.get(key_name)
        return None

    def add_external_api_key(self, session_id: str, service_name: str, api_key: str) -> bool:
        """
        Add an external API key for a session.

        Args:
            session_id: Session identifier
            service_name: Name of the external service
            api_key: API key value

        Returns:
            True if successful, False otherwise
        """
        secrets = self.get_session_secrets(session_id)
        if secrets:
            secrets.api_keys[service_name] = api_key
            logger.info(f"Added external API key for {service_name} to session {session_id[:8]}...")
            return True
        return False

    def revoke_session_secrets(self, session_id: str) -> bool:
        """
        Revoke all secrets for a session.

        Args:
            session_id: Session identifier

        Returns:
            True if secrets were found and revoked, False otherwise
        """
        if session_id in self._session_secrets:
            del self._session_secrets[session_id]
            logger.info(f"Revoked secrets for session {session_id[:8]}...")
            return True
        return False

    def rotate_session_secrets(self, session_id: str, operator_id: str) -> bool:
        """
        Rotate all secrets for a session.

        Args:
            session_id: Session identifier
            operator_id: Operator's identifier

        Returns:
            True if successful, False otherwise
        """
        if session_id in self._session_secrets:
            self.revoke_session_secrets(session_id)
        self.initialize_session_secrets(session_id, operator_id)
        logger.info(f"Rotated secrets for session {session_id[:8]}...")
        return True


class ContextInjector:
    """
    Context injection service for operator sessions.

    Manages operator context, permissions, and session state.
    Provides context enrichment for AI agent operations.
    """

    def __init__(self):
        self._operator_contexts: Dict[str, OperatorContext] = {}
        self._permission_cache: Dict[str, List[str]] = {}

    def _get_role_permissions(self, role: OperatorRole) -> List[str]:
        """Get base permissions for a role."""
        base_permissions = ["view_cases", "respond_cases"]

        role_permissions = {
            OperatorRole.AGENT: ["assign_self"],
            OperatorRole.SENIOR_AGENT: ["assign_self", "view_team_queue", "use_advanced_macros"],
            OperatorRole.TEAM_LEAD: ["assign_self", "assign_team", "view_team_queue", "use_advanced_macros", "escalate"],
            OperatorRole.SUPERVISOR: ["assign_self", "assign_team", "assign_any", "view_all_queues", "use_advanced_macros", "escalate", "override_sla"],
            OperatorRole.ADMIN: ["assign_self", "assign_team", "assign_any", "view_all_queues", "use_advanced_macros", "escalate", "override_sla", "manage_macros", "manage_users", "view_analytics"],
        }

        return base_permissions + role_permissions.get(role, [])

    def create_operator_context(
        self,
        operator_id: str,
        operator_name: str,
        role: OperatorRole,
        session_id: str,
        team_id: Optional[str] = None,
        team_name: Optional[str] = None,
        custom_permissions: Optional[List[str]] = None,
    ) -> OperatorContext:
        """
        Create a new operator context for a session.

        Args:
            operator_id: Unique operator identifier
            operator_name: Display name
            role: Operator's role
            session_id: Session identifier
            team_id: Optional team ID
            team_name: Optional team name
            custom_permissions: Additional permissions

        Returns:
            OperatorContext instance
        """
        permissions = self._get_role_permissions(role)
        if custom_permissions:
            permissions.extend(custom_permissions)
        permissions = list(set(permissions))  # Deduplicate

        context = OperatorContext(
            operator_id=operator_id,
            operator_name=operator_name,
            role=role,
            team_id=team_id,
            team_name=team_name,
            permissions=permissions,
            session_id=session_id,
            session_start=datetime.utcnow(),
            active_cases=0,
            max_concurrent_cases=self._get_max_concurrent_cases(role),
        )

        self._operator_contexts[session_id] = context
        self._permission_cache[session_id] = permissions

        logger.info(f"Created operator context for {operator_name} (role: {role.value})")
        return context

    def _get_max_concurrent_cases(self, role: OperatorRole) -> int:
        """Get maximum concurrent cases based on role."""
        max_cases = {
            OperatorRole.AGENT: 10,
            OperatorRole.SENIOR_AGENT: 15,
            OperatorRole.TEAM_LEAD: 8,
            OperatorRole.SUPERVISOR: 5,
            OperatorRole.ADMIN: 20,
        }
        return max_cases.get(role, 10)

    def get_operator_context(self, session_id: str) -> Optional[OperatorContext]:
        """Get operator context for a session."""
        return self._operator_contexts.get(session_id)

    def has_permission(self, session_id: str, permission: str) -> bool:
        """Check if operator has a specific permission."""
        permissions = self._permission_cache.get(session_id, [])
        return permission in permissions

    def update_active_cases(self, session_id: str, delta: int) -> None:
        """Update the count of active cases for an operator."""
        context = self._operator_contexts.get(session_id)
        if context:
            context.active_cases = max(0, context.active_cases + delta)

    def get_ai_context(self, session_id: str, case: Optional[Case] = None) -> Dict[str, Any]:
        """
        Generate AI context for agent operations.

        Args:
            session_id: Session identifier
            case: Optional case context

        Returns:
            Dictionary with AI context data
        """
        context = self.get_operator_context(session_id)
        if not context:
            return {}

        ai_context = {
            "operator": {
                "name": context.operator_name,
                "role": context.role.value,
                "team": context.team_name,
            },
            "session": {
                "start_time": context.session_start.isoformat(),
                "active_cases": context.active_cases,
            },
            "capabilities": {
                "can_escalate": "escalate" in context.permissions,
                "can_override_sla": "override_sla" in context.permissions,
                "can_use_advanced_macros": "use_advanced_macros" in context.permissions,
            },
        }

        if case:
            ai_context["case"] = {
                "id": case.case_id,
                "status": case.status.value,
                "priority": case.priority.value,
                "customer_tier": case.customer.tier,
                "sentiment": case.ai_sentiment,
                "category": case.ai_category,
            }

        return ai_context

    def invalidate_context(self, session_id: str) -> bool:
        """Remove operator context for a session."""
        if session_id in self._operator_contexts:
            del self._operator_contexts[session_id]
        if session_id in self._permission_cache:
            del self._permission_cache[session_id]
        logger.info(f"Invalidated context for session {session_id[:8]}...")
        return True


class DataAggregator:
    """
    Data aggregation service for the BFF layer.

    Aggregates data from multiple backend services to provide
    unified views for the frontend.
    """

    def __init__(self):
        # In production, these would connect to actual data stores
        self._cases: Dict[str, Case] = {}
        self._macros: Dict[str, MacroTemplate] = {}
        self._sla_policies: Dict[str, SLAPolicy] = {}
        self._initialize_demo_data()

    def _initialize_demo_data(self) -> None:
        """Initialize demo data for development/testing."""
        # Create demo SLA policies
        self._sla_policies = {
            "standard": SLAPolicy(
                policy_id="standard",
                name="Standard SLA",
                description="Default SLA for standard tier customers",
                priority=CasePriority.MEDIUM,
                first_response_minutes=60,
                resolution_minutes=480,
                business_hours_only=True,
            ),
            "premium": SLAPolicy(
                policy_id="premium",
                name="Premium SLA",
                description="Enhanced SLA for premium customers",
                priority=CasePriority.HIGH,
                first_response_minutes=30,
                resolution_minutes=240,
                business_hours_only=False,
            ),
            "enterprise": SLAPolicy(
                policy_id="enterprise",
                name="Enterprise SLA",
                description="Top-tier SLA for enterprise customers",
                priority=CasePriority.URGENT,
                first_response_minutes=15,
                resolution_minutes=120,
                business_hours_only=False,
            ),
        }

        # Create demo macros
        self._macros = {
            "greeting": MacroTemplate(
                macro_id="greeting",
                name="Standard Greeting",
                description="Standard greeting for customer interactions",
                type=MacroType.RESPONSE,
                category="greetings",
                content="Hello {{customer_name}},\n\nThank you for contacting Kupuri Studios support. My name is {{operator_name}} and I'll be assisting you today.\n\n{{custom_message}}\n\nBest regards,\n{{operator_name}}",
                variables=[
                    MacroVariable(name="customer_name", type="string", required=True),
                    MacroVariable(name="operator_name", type="string", required=True),
                    MacroVariable(name="custom_message", type="string", required=False, default_value="How can I help you?"),
                ],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            "escalation": MacroTemplate(
                macro_id="escalation",
                name="Escalation Notice",
                description="Notify customer of escalation",
                type=MacroType.ESCALATION,
                category="escalations",
                content="Hello {{customer_name}},\n\nI've escalated your case to our {{escalation_team}} team for further assistance. They will be in touch within {{response_time}}.\n\nYour case reference number is: {{case_number}}\n\nBest regards,\n{{operator_name}}",
                variables=[
                    MacroVariable(name="customer_name", type="string", required=True),
                    MacroVariable(name="operator_name", type="string", required=True),
                    MacroVariable(name="escalation_team", type="select", required=True, options=["Technical", "Billing", "Management"]),
                    MacroVariable(name="response_time", type="string", required=False, default_value="24 hours"),
                    MacroVariable(name="case_number", type="string", required=True),
                ],
                actions=[
                    {"type": "status_change", "value": "escalated"},
                    {"type": "assign_team", "team": "{{escalation_team}}"},
                ],
                required_permissions=["escalate"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            "resolution": MacroTemplate(
                macro_id="resolution",
                name="Case Resolution",
                description="Standard case resolution message",
                type=MacroType.WORKFLOW,
                category="resolutions",
                content="Hello {{customer_name}},\n\nI'm pleased to inform you that your issue has been resolved.\n\nResolution Summary:\n{{resolution_summary}}\n\nIf you have any further questions, please don't hesitate to reach out. We value your feedback - please take a moment to rate your experience.\n\nBest regards,\n{{operator_name}}",
                variables=[
                    MacroVariable(name="customer_name", type="string", required=True),
                    MacroVariable(name="operator_name", type="string", required=True),
                    MacroVariable(name="resolution_summary", type="string", required=True),
                ],
                actions=[
                    {"type": "status_change", "value": "resolved"},
                    {"type": "send_survey", "survey_type": "csat"},
                ],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
        }

        # Create demo cases
        now = datetime.utcnow()
        demo_cases = [
            Case(
                case_id="case-001",
                case_number="CS-2024-001",
                subject="Unable to access dashboard",
                description="Customer reports 404 error when accessing the main dashboard",
                status=CaseStatus.OPEN,
                priority=CasePriority.HIGH,
                channel="web",
                customer=CustomerInfo(
                    customer_id="cust-001",
                    name="Alice Johnson",
                    email="alice@example.com",
                    company="TechCorp Inc",
                    tier="premium",
                    previous_cases_count=3,
                ),
                created_at=now - timedelta(hours=2),
                updated_at=now - timedelta(minutes=30),
                messages=[
                    CaseMessage(
                        message_id="msg-001",
                        case_id="case-001",
                        sender_type="customer",
                        sender_id="cust-001",
                        sender_name="Alice Johnson",
                        content="I can't access the dashboard. Getting a 404 error.",
                        created_at=now - timedelta(hours=2),
                    ),
                ],
                sla=CaseSLAInfo(
                    sla_policy_id="premium",
                    sla_policy_name="Premium SLA",
                    first_response_target=now - timedelta(hours=1, minutes=30),
                    first_response_status=SLAStatus.AT_RISK,
                    resolution_target=now + timedelta(hours=2),
                    resolution_status=SLAStatus.ON_TRACK,
                ),
                tags=[CaseTag(tag_id="tag-1", name="technical", color="#FF5733")],
                ai_summary="Customer experiencing 404 errors accessing dashboard. May be related to recent deployment.",
                ai_sentiment="frustrated",
                ai_category="technical_issue",
            ),
            Case(
                case_id="case-002",
                case_number="CS-2024-002",
                subject="Billing discrepancy",
                description="Customer charged twice for monthly subscription",
                status=CaseStatus.IN_PROGRESS,
                priority=CasePriority.MEDIUM,
                channel="email",
                customer=CustomerInfo(
                    customer_id="cust-002",
                    name="Bob Smith",
                    email="bob@example.com",
                    company="StartupXYZ",
                    tier="standard",
                    previous_cases_count=1,
                ),
                assigned_operator_id="op-001",
                assigned_operator_name="Sarah Agent",
                created_at=now - timedelta(days=1),
                updated_at=now - timedelta(hours=1),
                messages=[
                    CaseMessage(
                        message_id="msg-002",
                        case_id="case-002",
                        sender_type="customer",
                        sender_id="cust-002",
                        sender_name="Bob Smith",
                        content="I was charged $99 twice this month. Please refund.",
                        created_at=now - timedelta(days=1),
                    ),
                    CaseMessage(
                        message_id="msg-003",
                        case_id="case-002",
                        sender_type="operator",
                        sender_id="op-001",
                        sender_name="Sarah Agent",
                        content="I'm looking into this for you. I can see the duplicate charge and will process a refund.",
                        created_at=now - timedelta(hours=2),
                    ),
                ],
                sla=CaseSLAInfo(
                    sla_policy_id="standard",
                    sla_policy_name="Standard SLA",
                    first_response_target=now - timedelta(hours=23),
                    first_response_actual=now - timedelta(hours=22),
                    first_response_status=SLAStatus.ON_TRACK,
                    resolution_target=now + timedelta(hours=7),
                    resolution_status=SLAStatus.ON_TRACK,
                ),
                tags=[CaseTag(tag_id="tag-2", name="billing", color="#3498DB")],
                ai_summary="Double charge issue - standard refund case",
                ai_sentiment="concerned",
                ai_category="billing",
            ),
            Case(
                case_id="case-003",
                case_number="CS-2024-003",
                subject="Feature request: Dark mode",
                description="Customer requesting dark mode for the application",
                status=CaseStatus.NEW,
                priority=CasePriority.LOW,
                channel="chat",
                customer=CustomerInfo(
                    customer_id="cust-003",
                    name="Charlie Davis",
                    email="charlie@example.com",
                    tier="standard",
                    previous_cases_count=0,
                ),
                created_at=now - timedelta(minutes=15),
                updated_at=now - timedelta(minutes=15),
                messages=[
                    CaseMessage(
                        message_id="msg-004",
                        case_id="case-003",
                        sender_type="customer",
                        sender_id="cust-003",
                        sender_name="Charlie Davis",
                        content="Would love to have dark mode! My eyes hurt using the app at night.",
                        created_at=now - timedelta(minutes=15),
                    ),
                ],
                sla=CaseSLAInfo(
                    sla_policy_id="standard",
                    sla_policy_name="Standard SLA",
                    first_response_target=now + timedelta(minutes=45),
                    first_response_status=SLAStatus.ON_TRACK,
                    resolution_target=now + timedelta(hours=8),
                    resolution_status=SLAStatus.ON_TRACK,
                ),
                tags=[CaseTag(tag_id="tag-3", name="feature_request", color="#2ECC71")],
                ai_summary="Feature request for dark mode - can be routed to product team",
                ai_sentiment="positive",
                ai_category="feature_request",
            ),
        ]

        for case in demo_cases:
            self._cases[case.case_id] = case

    async def get_queue(
        self,
        filters: Optional[QueueFilter],
        page: int,
        page_size: int,
        operator_context: OperatorContext,
    ) -> Tuple[List[CaseSummary], int, QueueStats]:
        """
        Get filtered queue of cases.

        Args:
            filters: Queue filters
            page: Page number
            page_size: Items per page
            operator_context: Current operator context

        Returns:
            Tuple of (cases, total_count, stats)
        """
        cases = list(self._cases.values())

        # Apply filters
        if filters:
            if filters.status:
                cases = [c for c in cases if c.status in filters.status]
            if filters.priority:
                cases = [c for c in cases if c.priority in filters.priority]
            if filters.channel:
                cases = [c for c in cases if c.channel in filters.channel]
            if filters.assigned_operator_id:
                cases = [c for c in cases if c.assigned_operator_id == filters.assigned_operator_id]
            if filters.unassigned_only:
                cases = [c for c in cases if c.assigned_operator_id is None]
            if filters.sla_status:
                cases = [c for c in cases if c.sla and c.sla.first_response_status in filters.sla_status]
            if filters.search_query:
                query = filters.search_query.lower()
                cases = [c for c in cases if query in c.subject.lower() or query in c.customer.name.lower()]

        # Calculate stats
        stats = QueueStats(
            total_cases=len(cases),
            new_cases=len([c for c in cases if c.status == CaseStatus.NEW]),
            open_cases=len([c for c in cases if c.status == CaseStatus.OPEN]),
            pending_cases=len([c for c in cases if c.status in [CaseStatus.PENDING_CUSTOMER, CaseStatus.PENDING_INTERNAL]]),
            escalated_cases=len([c for c in cases if c.status == CaseStatus.ESCALATED]),
            sla_at_risk=len([c for c in cases if c.sla and c.sla.first_response_status == SLAStatus.AT_RISK]),
            sla_breached=len([c for c in cases if c.sla and c.sla.first_response_status == SLAStatus.BREACHED]),
        )

        # Sort by priority and updated_at
        priority_order = {CasePriority.CRITICAL: 0, CasePriority.URGENT: 1, CasePriority.HIGH: 2, CasePriority.MEDIUM: 3, CasePriority.LOW: 4}
        cases.sort(key=lambda c: (priority_order.get(c.priority, 5), -c.updated_at.timestamp()))

        # Paginate
        total_count = len(cases)
        start = (page - 1) * page_size
        end = start + page_size
        cases = cases[start:end]

        # Convert to summaries
        summaries = [
            CaseSummary(
                case_id=c.case_id,
                case_number=c.case_number,
                subject=c.subject,
                status=c.status,
                priority=c.priority,
                channel=c.channel,
                customer_name=c.customer.name,
                customer_tier=c.customer.tier,
                assigned_operator_name=c.assigned_operator_name,
                sla_status=c.sla.first_response_status if c.sla else SLAStatus.ON_TRACK,
                sla_breach_risk=c.sla.first_response_status == SLAStatus.AT_RISK if c.sla else False,
                created_at=c.created_at,
                updated_at=c.updated_at,
                last_message_at=c.messages[-1].created_at if c.messages else None,
                unread_count=len([m for m in c.messages if m.sender_type == "customer"]),
                tags=[t.name for t in c.tags],
            )
            for c in cases
        ]

        return summaries, total_count, stats

    async def get_case(self, case_id: str, request: CaseRequest) -> Optional[CaseDetailContext]:
        """
        Get case with full context.

        Args:
            case_id: Case identifier
            request: Case request parameters

        Returns:
            CaseDetailContext if found, None otherwise
        """
        case = self._cases.get(case_id)
        if not case:
            return None

        # Build history
        history = [
            CaseHistoryItem(
                event_id="evt-001",
                event_type="created",
                description="Case created",
                actor_type="customer",
                actor_id=case.customer.customer_id,
                actor_name=case.customer.name,
                created_at=case.created_at,
            ),
        ]

        if case.assigned_operator_id:
            history.append(
                CaseHistoryItem(
                    event_id="evt-002",
                    event_type="assigned",
                    description=f"Assigned to {case.assigned_operator_name}",
                    actor_type="system",
                    new_value=case.assigned_operator_name,
                    created_at=case.updated_at,
                )
            )

        # Get related cases (demo: same customer)
        related_cases = [
            RelatedCase(
                case_id=c.case_id,
                case_number=c.case_number,
                subject=c.subject,
                status=c.status,
                relation_type="same_customer",
                created_at=c.created_at,
            )
            for c in self._cases.values()
            if c.customer.customer_id == case.customer.customer_id and c.case_id != case_id
        ]

        # Get available macros
        available_macros = list(self._macros.keys())

        return CaseDetailContext(
            case=case,
            history=history,
            related_cases=related_cases,
            customer_previous_cases=[],
            available_macros=available_macros,
            available_actions=["respond", "assign", "escalate", "resolve", "close"],
        )

    async def assign_case(
        self,
        request: AssignmentRequest,
        operator_context: OperatorContext,
    ) -> AssignmentResult:
        """
        Assign a case to an operator or team.

        Args:
            request: Assignment request
            operator_context: Current operator context

        Returns:
            AssignmentResult
        """
        case = self._cases.get(request.case_id)
        if not case:
            raise ValueError(f"Case not found: {request.case_id}")

        previous_operator_id = case.assigned_operator_id
        previous_team_id = case.team_id

        # Perform assignment
        if request.target_operator_id:
            case.assigned_operator_id = request.target_operator_id
            case.assigned_operator_name = f"Operator {request.target_operator_id}"  # In production, look up name

        if request.target_team_id:
            case.team_id = request.target_team_id
            case.team_name = f"Team {request.target_team_id}"  # In production, look up name

        if request.priority_override:
            case.priority = request.priority_override

        case.updated_at = datetime.utcnow()

        logger.info(f"Case {request.case_id} assigned: {previous_operator_id} -> {case.assigned_operator_id}")

        return AssignmentResult(
            case_id=request.case_id,
            previous_operator_id=previous_operator_id,
            new_operator_id=case.assigned_operator_id,
            previous_team_id=previous_team_id,
            new_team_id=case.team_id,
            assignment_type=request.assignment_type,
            assigned_at=datetime.utcnow(),
        )

    def get_macro(self, macro_id: str) -> Optional[MacroTemplate]:
        """Get a macro template by ID."""
        return self._macros.get(macro_id)

    def get_case_by_id(self, case_id: str) -> Optional[Case]:
        """Get a case by ID."""
        return self._cases.get(case_id)

    def get_sla_policy(self, policy_id: str) -> Optional[SLAPolicy]:
        """Get an SLA policy by ID."""
        return self._sla_policies.get(policy_id)

    def get_all_cases(self) -> List[Case]:
        """Get all cases."""
        return list(self._cases.values())


class MacroEngine:
    """
    Macro execution engine for the BFF layer.

    Handles macro template rendering and action execution.
    """

    def __init__(self, data_aggregator: DataAggregator):
        self._data_aggregator = data_aggregator

    def _render_template(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Render a macro template with variables.

        Args:
            template: Template string with {{variable}} placeholders
            variables: Variable values

        Returns:
            Rendered template string
        """
        result = template
        for key, value in variables.items():
            placeholder = "{{" + key + "}}"
            result = result.replace(placeholder, str(value))
        return result

    async def execute_macro(
        self,
        request: MacroExecuteRequest,
        operator_context: OperatorContext,
    ) -> MacroExecutionResult:
        """
        Execute a macro for a case.

        Args:
            request: Macro execution request
            operator_context: Current operator context

        Returns:
            MacroExecutionResult
        """
        start_time = time.time()
        execution_id = str(uuid.uuid4())

        # Get macro and case
        macro = self._data_aggregator.get_macro(request.macro_id)
        if not macro:
            raise ValueError(f"Macro not found: {request.macro_id}")

        case = self._data_aggregator.get_case_by_id(request.case_id)
        if not case:
            raise ValueError(f"Case not found: {request.case_id}")

        # Check permissions
        for perm in macro.required_permissions:
            if perm not in operator_context.permissions:
                raise PermissionError(f"Missing permission: {perm}")

        # Prepare variables
        variables = {
            "customer_name": case.customer.name,
            "operator_name": operator_context.operator_name,
            "case_number": case.case_number,
            **request.variables,
        }

        # Render template
        rendered_content = self._render_template(macro.content, variables)

        # Execute actions (if not preview only)
        steps: List[MacroExecutionStep] = []
        was_sent = False

        if not request.preview_only:
            for i, action in enumerate(macro.actions):
                step = MacroExecutionStep(
                    step_number=i + 1,
                    action=action.get("type", "unknown"),
                    status="pending",
                )

                try:
                    if action.get("type") == "status_change":
                        # Update case status
                        new_status = CaseStatus(action.get("value"))
                        case.status = new_status
                        step.status = "completed"
                        step.result = f"Status changed to {new_status.value}"
                    elif action.get("type") == "assign_team":
                        team = self._render_template(action.get("team", ""), variables)
                        case.team_name = team
                        step.status = "completed"
                        step.result = f"Assigned to team: {team}"
                    elif action.get("type") == "send_survey":
                        step.status = "completed"
                        step.result = f"Survey sent: {action.get('survey_type', 'csat')}"
                    else:
                        step.status = "skipped"
                        step.result = f"Unknown action type: {action.get('type')}"
                except Exception as e:
                    step.status = "failed"
                    step.error = str(e)

                step.executed_at = datetime.utcnow()
                steps.append(step)

            # Send message if requested
            if request.send_immediately:
                message = CaseMessage(
                    message_id=str(uuid.uuid4()),
                    case_id=case.case_id,
                    sender_type="operator",
                    sender_id=operator_context.operator_id,
                    sender_name=operator_context.operator_name,
                    content=rendered_content,
                    created_at=datetime.utcnow(),
                )
                case.messages.append(message)
                was_sent = True

        execution_time_ms = int((time.time() - start_time) * 1000)

        # Update macro usage count
        macro.usage_count += 1

        logger.info(f"Macro {request.macro_id} executed for case {request.case_id} in {execution_time_ms}ms")

        return MacroExecutionResult(
            execution_id=execution_id,
            macro_id=request.macro_id,
            case_id=request.case_id,
            rendered_content=rendered_content,
            steps=steps,
            was_sent=was_sent,
            execution_time_ms=execution_time_ms,
            executed_at=datetime.utcnow(),
        )


class SLAMonitor:
    """
    SLA monitoring service for the BFF layer.

    Monitors SLA compliance and generates alerts.
    """

    def __init__(self, data_aggregator: DataAggregator):
        self._data_aggregator = data_aggregator

    async def get_sla_status(
        self,
        request: SLAStatusRequest,
        operator_context: OperatorContext,
    ) -> Tuple[List[SLACaseStatus], SLASummary]:
        """
        Get SLA status for cases.

        Args:
            request: SLA status request
            operator_context: Current operator context

        Returns:
            Tuple of (case_statuses, summary)
        """
        cases = self._data_aggregator.get_all_cases()

        # Filter cases
        if request.case_ids:
            cases = [c for c in cases if c.case_id in request.case_ids]
        if not request.include_resolved:
            cases = [c for c in cases if c.status not in [CaseStatus.RESOLVED, CaseStatus.CLOSED]]
        if request.only_at_risk:
            cases = [c for c in cases if c.sla and c.sla.first_response_status in [SLAStatus.AT_RISK, SLAStatus.BREACHED]]
        if request.team_id:
            cases = [c for c in cases if c.team_id == request.team_id]

        # Build status list
        statuses: List[SLACaseStatus] = []
        for case in cases:
            if not case.sla:
                continue

            # Calculate time remaining
            time_remaining = None
            if case.sla.first_response_target and not case.sla.first_response_actual:
                delta = case.sla.first_response_target - datetime.utcnow()
                time_remaining = int(delta.total_seconds() / 60)

            # Determine overall status
            overall_status = SLAStatus.ON_TRACK
            if case.sla.first_response_status == SLAStatus.BREACHED or case.sla.resolution_status == SLAStatus.BREACHED:
                overall_status = SLAStatus.BREACHED
            elif case.sla.first_response_status == SLAStatus.AT_RISK or case.sla.resolution_status == SLAStatus.AT_RISK:
                overall_status = SLAStatus.AT_RISK

            statuses.append(
                SLACaseStatus(
                    case_id=case.case_id,
                    case_number=case.case_number,
                    subject=case.subject,
                    priority=case.priority,
                    sla_policy_name=case.sla.sla_policy_name,
                    first_response=case.sla,
                    resolution=case.sla,
                    overall_status=overall_status,
                    time_remaining_minutes=time_remaining,
                )
            )

        # Calculate summary
        total = len(statuses)
        on_track = len([s for s in statuses if s.overall_status == SLAStatus.ON_TRACK])
        at_risk = len([s for s in statuses if s.overall_status == SLAStatus.AT_RISK])
        breached = len([s for s in statuses if s.overall_status == SLAStatus.BREACHED])

        summary = SLASummary(
            total_cases=total,
            on_track_count=on_track,
            at_risk_count=at_risk,
            breached_count=breached,
            first_response_compliance_rate=on_track / total if total > 0 else 1.0,
            resolution_compliance_rate=on_track / total if total > 0 else 1.0,
        )

        return statuses, summary


class AnalyticsEngine:
    """
    Analytics computation engine for the BFF layer.

    Computes operator performance metrics and trends.
    """

    def __init__(self, data_aggregator: DataAggregator):
        self._data_aggregator = data_aggregator

    def _get_time_range(self, request: AnalyticsRequest) -> Tuple[datetime, datetime]:
        """Get time range from request."""
        now = datetime.utcnow()

        ranges = {
            AnalyticsTimeRange.TODAY: (now.replace(hour=0, minute=0, second=0, microsecond=0), now),
            AnalyticsTimeRange.YESTERDAY: (
                (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0),
                now.replace(hour=0, minute=0, second=0, microsecond=0)
            ),
            AnalyticsTimeRange.LAST_7_DAYS: (now - timedelta(days=7), now),
            AnalyticsTimeRange.LAST_30_DAYS: (now - timedelta(days=30), now),
            AnalyticsTimeRange.THIS_MONTH: (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), now),
        }

        if request.time_range == AnalyticsTimeRange.CUSTOM:
            return request.custom_start or now - timedelta(days=7), request.custom_end or now

        return ranges.get(request.time_range, (now - timedelta(days=7), now))

    async def get_analytics(
        self,
        request: AnalyticsRequest,
        operator_context: OperatorContext,
    ) -> AnalyticsData:
        """
        Get analytics data for an operator.

        Args:
            request: Analytics request
            operator_context: Current operator context

        Returns:
            AnalyticsData
        """
        start_time, end_time = self._get_time_range(request)
        cases = self._data_aggregator.get_all_cases()

        # Filter by time range
        cases = [c for c in cases if start_time <= c.created_at <= end_time]

        # Filter by operator or team
        operator_cases = [c for c in cases if c.assigned_operator_id == operator_context.operator_id]

        # Calculate operator performance
        resolved_cases = [c for c in operator_cases if c.status in [CaseStatus.RESOLVED, CaseStatus.CLOSED]]
        sla_compliant = [c for c in operator_cases if c.sla and c.sla.first_response_status == SLAStatus.ON_TRACK]

        operator_performance = OperatorPerformance(
            operator_id=operator_context.operator_id,
            operator_name=operator_context.operator_name,
            cases_handled=len(operator_cases),
            cases_resolved=len(resolved_cases),
            sla_compliance_rate=len(sla_compliant) / len(operator_cases) if operator_cases else 1.0,
            messages_sent=sum(
                len([m for m in c.messages if m.sender_type == "operator"])
                for c in operator_cases
            ),
        )

        # Build breakdown
        breakdown = AnalyticsBreakdown(
            by_channel={
                channel: len([c for c in cases if c.channel == channel])
                for channel in ["web", "email", "chat", "phone"]
            },
            by_priority={
                p.value: len([c for c in cases if c.priority == p])
                for p in CasePriority
            },
            by_status={
                s.value: len([c for c in cases if c.status == s])
                for s in CaseStatus
            },
            by_category={},
        )

        # Build trends if requested
        trends = None
        if request.include_trends:
            trends = AnalyticsTrends(
                cases_volume=[
                    TrendDataPoint(
                        timestamp=start_time + timedelta(days=i),
                        value=float(len([c for c in cases if c.created_at.date() == (start_time + timedelta(days=i)).date()])),
                    )
                    for i in range((end_time - start_time).days + 1)
                ],
            )

        return AnalyticsData(
            time_range_start=start_time,
            time_range_end=end_time,
            operator_performance=operator_performance,
            trends=trends,
            breakdown=breakdown,
            top_tags=[],
            top_macros=[],
        )


class ToolOrchestrator:
    """
    Tool chaining orchestration service for the BFF layer.

    Handles complex workflows involving multiple tool executions.
    """

    def __init__(self, secret_manager: SecretManager):
        self._secret_manager = secret_manager
        self._tools: Dict[str, ToolDefinition] = {}
        self._chains: Dict[str, ToolChain] = {}
        self._initialize_tools()

    def _initialize_tools(self) -> None:
        """Initialize available tools."""
        self._tools = {
            "send_email": ToolDefinition(
                tool_id="send_email",
                name="Send Email",
                description="Send an email to a recipient",
                input_schema={"recipient": "string", "subject": "string", "body": "string"},
                output_schema={"sent": "boolean", "message_id": "string"},
            ),
            "create_ticket": ToolDefinition(
                tool_id="create_ticket",
                name="Create Ticket",
                description="Create a support ticket in external system",
                input_schema={"title": "string", "description": "string", "priority": "string"},
                output_schema={"ticket_id": "string", "url": "string"},
            ),
            "lookup_customer": ToolDefinition(
                tool_id="lookup_customer",
                name="Lookup Customer",
                description="Look up customer information",
                input_schema={"customer_id": "string"},
                output_schema={"customer": "object"},
            ),
            "ai_classify": ToolDefinition(
                tool_id="ai_classify",
                name="AI Classify",
                description="Use AI to classify content",
                input_schema={"content": "string", "categories": "array"},
                output_schema={"category": "string", "confidence": "number"},
            ),
        }

    async def execute_tool(
        self,
        request: ToolExecutionRequest,
        operator_context: OperatorContext,
    ) -> ToolExecutionResult:
        """
        Execute a tool or tool chain.

        Args:
            request: Tool execution request
            operator_context: Current operator context

        Returns:
            ToolExecutionResult
        """
        start_time = time.time()
        execution_id = str(uuid.uuid4())

        # Get API keys for external services
        secrets = self._secret_manager.get_session_secrets(operator_context.session_id)

        if request.tool_id:
            # Execute single tool
            tool = self._tools.get(request.tool_id)
            if not tool:
                raise ValueError(f"Tool not found: {request.tool_id}")

            # Simulate tool execution
            output = {"status": "success", "result": f"Executed {tool.name}"}

            return ToolExecutionResult(
                execution_id=execution_id,
                tool_id=request.tool_id,
                status="success",
                output=output,
                steps_completed=[request.tool_id],
                execution_time_ms=int((time.time() - start_time) * 1000),
                executed_at=datetime.utcnow(),
            )

        elif request.chain_id:
            # Execute tool chain
            chain = self._chains.get(request.chain_id)
            if not chain:
                raise ValueError(f"Tool chain not found: {request.chain_id}")

            completed_steps = []
            errors = []
            context = {**chain.initial_context, **request.input_data}

            for step in chain.steps:
                try:
                    tool = self._tools.get(step.tool_id)
                    if not tool:
                        raise ValueError(f"Tool not found: {step.tool_id}")

                    # Simulate step execution
                    step_output = {"status": "success"}
                    context[step.output_key] = step_output
                    completed_steps.append(step.step_id)

                except Exception as e:
                    errors.append({"step_id": step.step_id, "error": str(e)})
                    if step.on_error == "stop":
                        break

            status = "success" if not errors else ("partial" if completed_steps else "failed")

            return ToolExecutionResult(
                execution_id=execution_id,
                chain_id=request.chain_id,
                status=status,
                output=context,
                steps_completed=completed_steps,
                errors=errors,
                execution_time_ms=int((time.time() - start_time) * 1000),
                executed_at=datetime.utcnow(),
            )

        raise ValueError("Either tool_id or chain_id must be provided")


class BFFService:
    """
    Main BFF Service that orchestrates all BFF operations.

    This is the primary entry point for BFF functionality.
    """

    def __init__(self):
        self.secret_manager = SecretManager()
        self.context_injector = ContextInjector()
        self.data_aggregator = DataAggregator()
        self.macro_engine = MacroEngine(self.data_aggregator)
        self.sla_monitor = SLAMonitor(self.data_aggregator)
        self.analytics_engine = AnalyticsEngine(self.data_aggregator)
        self.tool_orchestrator = ToolOrchestrator(self.secret_manager)

        logger.info("BFF Service initialized")

    def initialize_session(
        self,
        operator_id: str,
        operator_name: str,
        role: OperatorRole,
        session_id: str,
        team_id: Optional[str] = None,
        team_name: Optional[str] = None,
    ) -> OperatorContext:
        """
        Initialize a new operator session.

        Args:
            operator_id: Operator's unique identifier
            operator_name: Display name
            role: Operator's role
            session_id: Session identifier
            team_id: Optional team ID
            team_name: Optional team name

        Returns:
            OperatorContext for the session
        """
        # Initialize secrets
        self.secret_manager.initialize_session_secrets(session_id, operator_id)

        # Create operator context
        context = self.context_injector.create_operator_context(
            operator_id=operator_id,
            operator_name=operator_name,
            role=role,
            session_id=session_id,
            team_id=team_id,
            team_name=team_name,
        )

        logger.info(f"Session initialized for operator {operator_name} ({session_id[:8]}...)")
        return context

    def end_session(self, session_id: str) -> None:
        """
        End an operator session and cleanup resources.

        Args:
            session_id: Session identifier
        """
        self.secret_manager.revoke_session_secrets(session_id)
        self.context_injector.invalidate_context(session_id)
        logger.info(f"Session ended: {session_id[:8]}...")

    def validate_session(self, session_id: str, operator_id: str) -> bool:
        """
        Validate that a session is active and belongs to the operator.

        Args:
            session_id: Session identifier
            operator_id: Operator's identifier

        Returns:
            True if session is valid, False otherwise
        """
        context = self.context_injector.get_operator_context(session_id)
        if context and context.operator_id == operator_id:
            return True
        return False

    def get_operator_context(self, session_id: str) -> Optional[OperatorContext]:
        """Get operator context for a session."""
        return self.context_injector.get_operator_context(session_id)

    async def get_queue(self, request: QueueRequest) -> Tuple[List[CaseSummary], int, QueueStats]:
        """Get filtered queue of cases."""
        context = self.context_injector.get_operator_context(request.session_id)
        if not context:
            raise ValueError("Invalid session")

        return await self.data_aggregator.get_queue(
            filters=request.filters,
            page=request.pagination.page,
            page_size=request.pagination.page_size,
            operator_context=context,
        )

    async def get_case(self, case_id: str, request: CaseRequest) -> Optional[CaseDetailContext]:
        """Get case with full context."""
        context = self.context_injector.get_operator_context(request.session_id)
        if not context:
            raise ValueError("Invalid session")

        return await self.data_aggregator.get_case(case_id, request)

    async def assign_case(self, request: AssignmentRequest) -> AssignmentResult:
        """Assign a case to an operator or team."""
        context = self.context_injector.get_operator_context(request.session_id)
        if not context:
            raise ValueError("Invalid session")

        # Check permission
        if request.target_operator_id != context.operator_id:
            if not self.context_injector.has_permission(request.session_id, "assign_team"):
                raise PermissionError("Not authorized to assign to other operators")

        return await self.data_aggregator.assign_case(request, context)

    async def execute_macro(self, request: MacroExecuteRequest) -> MacroExecutionResult:
        """Execute a macro for a case."""
        context = self.context_injector.get_operator_context(request.session_id)
        if not context:
            raise ValueError("Invalid session")

        return await self.macro_engine.execute_macro(request, context)

    async def get_sla_status(self, request: SLAStatusRequest) -> Tuple[List[SLACaseStatus], SLASummary]:
        """Get SLA status for cases."""
        context = self.context_injector.get_operator_context(request.session_id)
        if not context:
            raise ValueError("Invalid session")

        return await self.sla_monitor.get_sla_status(request, context)

    async def get_analytics(self, request: AnalyticsRequest) -> AnalyticsData:
        """Get analytics data for an operator."""
        context = self.context_injector.get_operator_context(request.session_id)
        if not context:
            raise ValueError("Invalid session")

        return await self.analytics_engine.get_analytics(request, context)

    async def execute_tool(self, request: ToolExecutionRequest) -> ToolExecutionResult:
        """Execute a tool or tool chain."""
        context = self.context_injector.get_operator_context(request.session_id)
        if not context:
            raise ValueError("Invalid session")

        return await self.tool_orchestrator.execute_tool(request, context)

    def get_ai_context(self, session_id: str, case_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get AI context for agent operations.

        Args:
            session_id: Session identifier
            case_id: Optional case ID

        Returns:
            AI context dictionary
        """
        case = None
        if case_id:
            case = self.data_aggregator.get_case_by_id(case_id)

        return self.context_injector.get_ai_context(session_id, case)


# Create singleton instance
bff_service = BFFService()
