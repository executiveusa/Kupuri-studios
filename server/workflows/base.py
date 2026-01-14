"""
Kupuri Studios - Workflow Engine Base
=====================================
Hard-coded workflow patterns replacing n8n for reliability.
These workflows operate server-side with full secret access.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Optional
import asyncio
import logging
import uuid

logger = logging.getLogger(__name__)


class WorkflowStatus(Enum):
    """Workflow execution states."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class StepType(Enum):
    """Types of workflow steps."""
    ACTION = "action"
    CONDITION = "condition"
    LOOP = "loop"
    PARALLEL = "parallel"
    WEBHOOK = "webhook"
    DELAY = "delay"
    HUMAN_IN_LOOP = "human_in_loop"


@dataclass
class WorkflowContext:
    """Shared context passed through workflow execution."""
    workflow_id: str
    run_id: str
    variables: dict[str, Any] = field(default_factory=dict)
    secrets: dict[str, str] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)
    
    # Execution tracking
    started_at: datetime = field(default_factory=datetime.utcnow)
    current_step: Optional[str] = None
    step_results: dict[str, Any] = field(default_factory=dict)
    errors: list[dict] = field(default_factory=list)
    
    def set(self, key: str, value: Any) -> None:
        """Set a variable in context."""
        self.variables[key] = value
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a variable from context."""
        return self.variables.get(key, default)
    
    def add_error(self, step: str, error: Exception) -> None:
        """Record an error that occurred during execution."""
        self.errors.append({
            "step": step,
            "error": str(error),
            "type": type(error).__name__,
            "timestamp": datetime.utcnow().isoformat()
        })


@dataclass
class StepResult:
    """Result of a single workflow step execution."""
    step_id: str
    success: bool
    data: Any = None
    error: Optional[str] = None
    duration_ms: float = 0.0
    
    def to_dict(self) -> dict:
        return {
            "step_id": self.step_id,
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "duration_ms": self.duration_ms
        }


class WorkflowStep(ABC):
    """Abstract base class for workflow steps."""
    
    def __init__(
        self,
        step_id: str,
        step_type: StepType = StepType.ACTION,
        name: Optional[str] = None,
        description: Optional[str] = None,
        retry_count: int = 0,
        retry_delay_ms: int = 1000,
        timeout_ms: Optional[int] = None
    ):
        self.step_id = step_id
        self.step_type = step_type
        self.name = name or step_id
        self.description = description
        self.retry_count = retry_count
        self.retry_delay_ms = retry_delay_ms
        self.timeout_ms = timeout_ms
    
    @abstractmethod
    async def execute(self, ctx: WorkflowContext) -> StepResult:
        """Execute this step with the given context."""
        pass
    
    async def run_with_retry(self, ctx: WorkflowContext) -> StepResult:
        """Execute with retry logic."""
        last_error = None
        
        for attempt in range(self.retry_count + 1):
            try:
                start_time = datetime.utcnow()
                
                if self.timeout_ms:
                    result = await asyncio.wait_for(
                        self.execute(ctx),
                        timeout=self.timeout_ms / 1000
                    )
                else:
                    result = await self.execute(ctx)
                
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                result.duration_ms = duration
                return result
                
            except asyncio.TimeoutError:
                last_error = "Step timed out"
                logger.warning(f"Step {self.step_id} timed out (attempt {attempt + 1})")
                
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Step {self.step_id} failed (attempt {attempt + 1}): {e}")
            
            if attempt < self.retry_count:
                await asyncio.sleep(self.retry_delay_ms / 1000)
        
        return StepResult(
            step_id=self.step_id,
            success=False,
            error=last_error
        )


class ActionStep(WorkflowStep):
    """A step that executes an async function."""
    
    def __init__(
        self,
        step_id: str,
        action: Callable[[WorkflowContext], Any],
        **kwargs
    ):
        super().__init__(step_id, StepType.ACTION, **kwargs)
        self.action = action
    
    async def execute(self, ctx: WorkflowContext) -> StepResult:
        try:
            if asyncio.iscoroutinefunction(self.action):
                result = await self.action(ctx)
            else:
                result = self.action(ctx)
            
            return StepResult(
                step_id=self.step_id,
                success=True,
                data=result
            )
        except Exception as e:
            ctx.add_error(self.step_id, e)
            return StepResult(
                step_id=self.step_id,
                success=False,
                error=str(e)
            )


class ConditionStep(WorkflowStep):
    """A step that branches based on a condition."""
    
    def __init__(
        self,
        step_id: str,
        condition: Callable[[WorkflowContext], bool],
        true_branch: list["WorkflowStep"],
        false_branch: Optional[list["WorkflowStep"]] = None,
        **kwargs
    ):
        super().__init__(step_id, StepType.CONDITION, **kwargs)
        self.condition = condition
        self.true_branch = true_branch
        self.false_branch = false_branch or []
    
    async def execute(self, ctx: WorkflowContext) -> StepResult:
        try:
            condition_result = self.condition(ctx)
            branch = self.true_branch if condition_result else self.false_branch
            
            branch_results = []
            for step in branch:
                result = await step.run_with_retry(ctx)
                branch_results.append(result.to_dict())
                ctx.step_results[step.step_id] = result.data
                
                if not result.success:
                    return StepResult(
                        step_id=self.step_id,
                        success=False,
                        data={"branch_results": branch_results},
                        error=f"Branch step {step.step_id} failed"
                    )
            
            return StepResult(
                step_id=self.step_id,
                success=True,
                data={
                    "condition": condition_result,
                    "branch_results": branch_results
                }
            )
        except Exception as e:
            ctx.add_error(self.step_id, e)
            return StepResult(
                step_id=self.step_id,
                success=False,
                error=str(e)
            )


class ParallelStep(WorkflowStep):
    """Execute multiple steps in parallel."""
    
    def __init__(
        self,
        step_id: str,
        steps: list[WorkflowStep],
        fail_fast: bool = True,
        **kwargs
    ):
        super().__init__(step_id, StepType.PARALLEL, **kwargs)
        self.steps = steps
        self.fail_fast = fail_fast
    
    async def execute(self, ctx: WorkflowContext) -> StepResult:
        try:
            tasks = [step.run_with_retry(ctx) for step in self.steps]
            
            if self.fail_fast:
                results = await asyncio.gather(*tasks, return_exceptions=True)
            else:
                results = await asyncio.gather(*tasks, return_exceptions=False)
            
            all_results = []
            has_failure = False
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    all_results.append({
                        "step_id": self.steps[i].step_id,
                        "success": False,
                        "error": str(result)
                    })
                    has_failure = True
                else:
                    all_results.append(result.to_dict())
                    ctx.step_results[result.step_id] = result.data
                    if not result.success:
                        has_failure = True
            
            return StepResult(
                step_id=self.step_id,
                success=not has_failure,
                data={"parallel_results": all_results}
            )
        except Exception as e:
            ctx.add_error(self.step_id, e)
            return StepResult(
                step_id=self.step_id,
                success=False,
                error=str(e)
            )


class DelayStep(WorkflowStep):
    """Wait for a specified duration."""
    
    def __init__(self, step_id: str, delay_ms: int, **kwargs):
        super().__init__(step_id, StepType.DELAY, **kwargs)
        self.delay_ms = delay_ms
    
    async def execute(self, ctx: WorkflowContext) -> StepResult:
        await asyncio.sleep(self.delay_ms / 1000)
        return StepResult(
            step_id=self.step_id,
            success=True,
            data={"delayed_ms": self.delay_ms}
        )


@dataclass
class WorkflowDefinition:
    """Definition of a complete workflow."""
    workflow_id: str
    name: str
    description: Optional[str] = None
    version: str = "1.0.0"
    steps: list[WorkflowStep] = field(default_factory=list)
    triggers: list[dict] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class WorkflowEngine:
    """
    Main workflow execution engine.
    Replaces n8n with hard-coded, reliable Python workflows.
    """
    
    def __init__(self, secrets: dict[str, str]):
        self.secrets = secrets
        self.workflows: dict[str, WorkflowDefinition] = {}
        self.active_runs: dict[str, WorkflowContext] = {}
        self._hooks: dict[str, list[Callable]] = {
            "on_start": [],
            "on_step_complete": [],
            "on_complete": [],
            "on_error": []
        }
    
    def register_workflow(self, workflow: WorkflowDefinition) -> None:
        """Register a workflow definition."""
        self.workflows[workflow.workflow_id] = workflow
        logger.info(f"Registered workflow: {workflow.workflow_id}")
    
    def add_hook(self, event: str, callback: Callable) -> None:
        """Add a lifecycle hook."""
        if event in self._hooks:
            self._hooks[event].append(callback)
    
    async def _fire_hooks(self, event: str, *args, **kwargs) -> None:
        """Fire all hooks for an event."""
        for hook in self._hooks.get(event, []):
            try:
                if asyncio.iscoroutinefunction(hook):
                    await hook(*args, **kwargs)
                else:
                    hook(*args, **kwargs)
            except Exception as e:
                logger.error(f"Hook error for {event}: {e}")
    
    async def execute(
        self,
        workflow_id: str,
        variables: Optional[dict[str, Any]] = None,
        metadata: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """Execute a workflow by ID."""
        
        if workflow_id not in self.workflows:
            raise ValueError(f"Unknown workflow: {workflow_id}")
        
        workflow = self.workflows[workflow_id]
        run_id = str(uuid.uuid4())
        
        ctx = WorkflowContext(
            workflow_id=workflow_id,
            run_id=run_id,
            variables=variables or {},
            secrets=self.secrets,
            metadata=metadata or {}
        )
        
        self.active_runs[run_id] = ctx
        
        try:
            await self._fire_hooks("on_start", ctx, workflow)
            
            for step in workflow.steps:
                ctx.current_step = step.step_id
                
                result = await step.run_with_retry(ctx)
                ctx.step_results[step.step_id] = result.data
                
                await self._fire_hooks("on_step_complete", ctx, step, result)
                
                if not result.success:
                    await self._fire_hooks("on_error", ctx, step, result)
                    return {
                        "run_id": run_id,
                        "workflow_id": workflow_id,
                        "status": WorkflowStatus.FAILED.value,
                        "error": result.error,
                        "failed_step": step.step_id,
                        "step_results": ctx.step_results,
                        "errors": ctx.errors
                    }
            
            await self._fire_hooks("on_complete", ctx)
            
            return {
                "run_id": run_id,
                "workflow_id": workflow_id,
                "status": WorkflowStatus.COMPLETED.value,
                "step_results": ctx.step_results,
                "duration_ms": (datetime.utcnow() - ctx.started_at).total_seconds() * 1000
            }
            
        finally:
            del self.active_runs[run_id]
    
    def list_workflows(self) -> list[dict]:
        """List all registered workflows."""
        return [
            {
                "workflow_id": w.workflow_id,
                "name": w.name,
                "description": w.description,
                "version": w.version,
                "step_count": len(w.steps),
                "triggers": w.triggers
            }
            for w in self.workflows.values()
        ]
    
    def get_active_runs(self) -> list[dict]:
        """Get all currently executing workflow runs."""
        return [
            {
                "run_id": ctx.run_id,
                "workflow_id": ctx.workflow_id,
                "current_step": ctx.current_step,
                "started_at": ctx.started_at.isoformat(),
                "variables": list(ctx.variables.keys())
            }
            for ctx in self.active_runs.values()
        ]


# Export commonly used items
__all__ = [
    "WorkflowEngine",
    "WorkflowDefinition",
    "WorkflowContext",
    "WorkflowStep",
    "ActionStep",
    "ConditionStep",
    "ParallelStep",
    "DelayStep",
    "StepResult",
    "WorkflowStatus",
    "StepType"
]
