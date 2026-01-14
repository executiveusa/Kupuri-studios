"""
Kupuri Studios - Agent Registry System
======================================
Multi-agent orchestration with LangGraph patterns.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Optional, TypedDict
import logging
import uuid

logger = logging.getLogger(__name__)


class AgentRole(Enum):
    """Agent specializations."""
    SUPERVISOR = "supervisor"
    RESEARCHER = "researcher"
    WRITER = "writer"
    CODER = "coder"
    ANALYST = "analyst"
    CUSTOMER_SUPPORT = "customer_support"
    SALES = "sales"
    LEAD_QUALIFIER = "lead_qualifier"
    CONTENT_CREATOR = "content_creator"
    SEO_SPECIALIST = "seo_specialist"
    SOCIAL_MEDIA = "social_media"
    TRANSLATOR = "translator"
    QA_REVIEWER = "qa_reviewer"


class AgentStatus(Enum):
    """Agent availability status."""
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    ERROR = "error"


class TaskPriority(Enum):
    """Task priority levels."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4


@dataclass
class AgentCapability:
    """Defines what an agent can do."""
    name: str
    description: str
    input_schema: dict
    output_schema: dict
    estimated_duration_ms: int = 5000
    requires_human_approval: bool = False


@dataclass
class AgentConfig:
    """Configuration for an agent."""
    agent_id: str
    name: str
    role: AgentRole
    description: str
    capabilities: list[AgentCapability] = field(default_factory=list)
    
    # LLM Configuration
    model: str = "claude-sonnet-4-20250514"
    temperature: float = 0.7
    max_tokens: int = 4096
    system_prompt: Optional[str] = None
    
    # Behavior
    max_concurrent_tasks: int = 5
    timeout_ms: int = 30000
    retry_count: int = 2
    
    # Tools
    tools: list[str] = field(default_factory=list)
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict = field(default_factory=dict)


@dataclass
class Task:
    """A task to be executed by an agent."""
    task_id: str
    name: str
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    
    # Assignment
    assigned_agent_id: Optional[str] = None
    required_role: Optional[AgentRole] = None
    required_capabilities: list[str] = field(default_factory=list)
    
    # Input/Output
    input_data: dict = field(default_factory=dict)
    output_data: Optional[dict] = None
    
    # Status
    status: str = "pending"
    progress: float = 0.0
    error: Optional[str] = None
    
    # Timing
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Conversation context
    conversation_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    child_task_ids: list[str] = field(default_factory=list)


class AgentState(TypedDict):
    """State passed through agent graph."""
    messages: list[dict]
    current_agent: str
    task: dict
    context: dict
    results: list[dict]
    next_agent: Optional[str]
    should_end: bool


class Agent:
    """
    Base agent implementation.
    Can be extended for specialized behaviors.
    """
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.status = AgentStatus.AVAILABLE
        self.active_tasks: list[str] = []
        self._task_history: list[Task] = []
    
    @property
    def agent_id(self) -> str:
        return self.config.agent_id
    
    @property
    def is_available(self) -> bool:
        return (
            self.status == AgentStatus.AVAILABLE and
            len(self.active_tasks) < self.config.max_concurrent_tasks
        )
    
    def can_handle(self, task: Task) -> bool:
        """Check if this agent can handle a task."""
        # Check role match
        if task.required_role and task.required_role != self.config.role:
            return False
        
        # Check capability match
        if task.required_capabilities:
            agent_capabilities = {c.name for c in self.config.capabilities}
            if not all(cap in agent_capabilities for cap in task.required_capabilities):
                return False
        
        return True
    
    async def execute(self, task: Task, context: dict) -> dict:
        """Execute a task. Override in subclasses for specialized behavior."""
        logger.info(f"Agent {self.agent_id} executing task {task.task_id}")
        
        self.active_tasks.append(task.task_id)
        self.status = AgentStatus.BUSY
        
        try:
            # This would be replaced with actual LLM call
            result = await self._process_task(task, context)
            
            task.status = "completed"
            task.output_data = result
            task.completed_at = datetime.utcnow()
            
            return result
            
        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            raise
            
        finally:
            self.active_tasks.remove(task.task_id)
            if not self.active_tasks:
                self.status = AgentStatus.AVAILABLE
            self._task_history.append(task)
    
    async def _process_task(self, task: Task, context: dict) -> dict:
        """Process task - override in subclasses."""
        return {
            "agent_id": self.agent_id,
            "task_id": task.task_id,
            "status": "completed",
            "message": f"Task processed by {self.config.name}"
        }
    
    def get_stats(self) -> dict:
        """Get agent statistics."""
        completed = [t for t in self._task_history if t.status == "completed"]
        failed = [t for t in self._task_history if t.status == "failed"]
        
        return {
            "agent_id": self.agent_id,
            "name": self.config.name,
            "role": self.config.role.value,
            "status": self.status.value,
            "active_tasks": len(self.active_tasks),
            "total_completed": len(completed),
            "total_failed": len(failed),
            "success_rate": len(completed) / max(len(self._task_history), 1)
        }


class AgentRegistry:
    """
    Registry for managing multiple agents.
    Provides routing and orchestration capabilities.
    """
    
    def __init__(self):
        self._agents: dict[str, Agent] = {}
        self._pending_tasks: list[Task] = []
        self._completed_tasks: list[Task] = []
    
    def register(self, agent: Agent) -> None:
        """Register an agent."""
        self._agents[agent.agent_id] = agent
        logger.info(f"Registered agent: {agent.config.name} ({agent.agent_id})")
    
    def unregister(self, agent_id: str) -> None:
        """Unregister an agent."""
        if agent_id in self._agents:
            del self._agents[agent_id]
            logger.info(f"Unregistered agent: {agent_id}")
    
    def get(self, agent_id: str) -> Optional[Agent]:
        """Get an agent by ID."""
        return self._agents.get(agent_id)
    
    def get_by_role(self, role: AgentRole) -> list[Agent]:
        """Get all agents with a specific role."""
        return [a for a in self._agents.values() if a.config.role == role]
    
    def get_available(self, role: Optional[AgentRole] = None) -> list[Agent]:
        """Get all available agents, optionally filtered by role."""
        agents = self._agents.values()
        if role:
            agents = [a for a in agents if a.config.role == role]
        return [a for a in agents if a.is_available]
    
    def find_best_agent(self, task: Task) -> Optional[Agent]:
        """Find the best available agent for a task."""
        candidates = []
        
        for agent in self._agents.values():
            if agent.is_available and agent.can_handle(task):
                # Calculate a simple score based on current load
                score = agent.config.max_concurrent_tasks - len(agent.active_tasks)
                candidates.append((agent, score))
        
        if not candidates:
            return None
        
        # Return agent with highest score (most capacity)
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]
    
    async def submit_task(self, task: Task) -> str:
        """Submit a task for execution."""
        task.task_id = task.task_id or str(uuid.uuid4())[:12]
        
        agent = self.find_best_agent(task)
        if not agent:
            self._pending_tasks.append(task)
            logger.warning(f"No available agent for task {task.task_id}, queued")
            return task.task_id
        
        task.assigned_agent_id = agent.agent_id
        task.started_at = datetime.utcnow()
        task.status = "running"
        
        # Execute asynchronously
        try:
            result = await agent.execute(task, {})
            self._completed_tasks.append(task)
        except Exception as e:
            logger.error(f"Task {task.task_id} failed: {e}")
        
        return task.task_id
    
    def list_agents(self) -> list[dict]:
        """List all agents with their status."""
        return [agent.get_stats() for agent in self._agents.values()]
    
    def get_task_queue(self) -> list[dict]:
        """Get pending tasks."""
        return [
            {
                "task_id": t.task_id,
                "name": t.name,
                "priority": t.priority.value,
                "required_role": t.required_role.value if t.required_role else None,
                "created_at": t.created_at.isoformat()
            }
            for t in self._pending_tasks
        ]
    
    def get_metrics(self) -> dict:
        """Get registry-wide metrics."""
        total_agents = len(self._agents)
        available_agents = len([a for a in self._agents.values() if a.is_available])
        
        total_completed = len(self._completed_tasks)
        total_failed = len([t for t in self._completed_tasks if t.status == "failed"])
        
        return {
            "total_agents": total_agents,
            "available_agents": available_agents,
            "pending_tasks": len(self._pending_tasks),
            "completed_tasks": total_completed,
            "failed_tasks": total_failed,
            "success_rate": (total_completed - total_failed) / max(total_completed, 1)
        }


# Pre-configured agent templates
def create_supervisor_agent() -> Agent:
    """Create a supervisor agent for orchestration."""
    config = AgentConfig(
        agent_id="supervisor-001",
        name="Supervisor",
        role=AgentRole.SUPERVISOR,
        description="Orchestrates tasks between specialized agents",
        model="claude-sonnet-4-20250514",
        temperature=0.3,
        system_prompt="""You are a supervisor agent responsible for:
1. Analyzing incoming tasks and determining which specialist should handle them
2. Breaking down complex tasks into subtasks
3. Coordinating between multiple agents
4. Ensuring quality of outputs

Available specialists:
- RESEARCHER: Information gathering and analysis
- WRITER: Content creation and editing
- CODER: Code generation and review
- ANALYST: Data analysis and insights
- CUSTOMER_SUPPORT: Customer interactions
- SALES: Sales and lead handling

For each task, respond with the specialist role to assign.""",
        capabilities=[
            AgentCapability(
                name="task_routing",
                description="Route tasks to appropriate specialists",
                input_schema={"task": "string"},
                output_schema={"agent_role": "string", "reasoning": "string"}
            ),
            AgentCapability(
                name="task_decomposition",
                description="Break complex tasks into subtasks",
                input_schema={"task": "string"},
                output_schema={"subtasks": "array"}
            )
        ]
    )
    return Agent(config)


def create_lead_qualifier_agent() -> Agent:
    """Create a lead qualification agent."""
    config = AgentConfig(
        agent_id="lead-qualifier-001",
        name="Lead Qualifier",
        role=AgentRole.LEAD_QUALIFIER,
        description="Qualifies and scores incoming leads",
        model="claude-sonnet-4-20250514",
        temperature=0.5,
        system_prompt="""You are a lead qualification specialist. Your job is to:
1. Analyze lead information
2. Score leads based on fit and intent
3. Determine appropriate follow-up actions
4. Route hot leads for immediate attention

Use the BANT framework (Budget, Authority, Need, Timeline) for qualification.""",
        capabilities=[
            AgentCapability(
                name="lead_scoring",
                description="Score a lead based on qualification criteria",
                input_schema={"lead": "object"},
                output_schema={"score": "number", "quality": "string", "next_action": "string"}
            )
        ]
    )
    return Agent(config)


def create_content_agent() -> Agent:
    """Create a content creation agent."""
    config = AgentConfig(
        agent_id="content-creator-001",
        name="Content Creator",
        role=AgentRole.CONTENT_CREATOR,
        description="Creates marketing content and copy",
        model="claude-sonnet-4-20250514",
        temperature=0.8,
        system_prompt="""You are a creative content specialist for a digital agency. Your job is to:
1. Write compelling marketing copy
2. Create landing page content
3. Draft social media posts
4. Write email sequences

Always write in the brand voice: Professional yet approachable, confident but not arrogant.
Support both English and Spanish content.""",
        capabilities=[
            AgentCapability(
                name="landing_page_copy",
                description="Write landing page content",
                input_schema={"niche": "string", "business_name": "string"},
                output_schema={"headline": "string", "subheadline": "string", "body": "string"}
            ),
            AgentCapability(
                name="social_post",
                description="Create social media posts",
                input_schema={"platform": "string", "topic": "string"},
                output_schema={"post": "string", "hashtags": "array"}
            )
        ]
    )
    return Agent(config)


def create_customer_support_agent() -> Agent:
    """Create a customer support agent."""
    config = AgentConfig(
        agent_id="support-agent-001",
        name="Support Agent",
        role=AgentRole.CUSTOMER_SUPPORT,
        description="Handles customer inquiries and support tickets",
        model="claude-sonnet-4-20250514",
        temperature=0.4,
        system_prompt="""You are a friendly and helpful customer support agent. Your job is to:
1. Answer customer questions accurately
2. Resolve issues efficiently
3. Escalate complex problems appropriately
4. Maintain a positive, empathetic tone

Always:
- Acknowledge the customer's concern
- Provide clear, actionable solutions
- Follow up to ensure satisfaction""",
        capabilities=[
            AgentCapability(
                name="ticket_response",
                description="Respond to support tickets",
                input_schema={"ticket": "object"},
                output_schema={"response": "string", "should_escalate": "boolean"}
            )
        ]
    )
    return Agent(config)


def create_default_registry() -> AgentRegistry:
    """Create a registry with default agents."""
    registry = AgentRegistry()
    
    # Register default agents
    registry.register(create_supervisor_agent())
    registry.register(create_lead_qualifier_agent())
    registry.register(create_content_agent())
    registry.register(create_customer_support_agent())
    
    return registry


__all__ = [
    "Agent",
    "AgentConfig",
    "AgentCapability",
    "AgentRole",
    "AgentStatus",
    "AgentRegistry",
    "AgentState",
    "Task",
    "TaskPriority",
    "create_default_registry",
    "create_supervisor_agent",
    "create_lead_qualifier_agent",
    "create_content_agent",
    "create_customer_support_agent"
]
