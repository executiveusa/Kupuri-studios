"""
Kupuri Studios - Workflows Package
===================================
Hard-coded workflow engine replacing n8n for reliability.
"""

from .base import (
    WorkflowEngine,
    WorkflowDefinition,
    WorkflowContext,
    WorkflowStep,
    ActionStep,
    ConditionStep,
    ParallelStep,
    DelayStep,
    StepResult,
    WorkflowStatus,
    StepType
)

from .niche_detector import (
    NicheDetector,
    NicheDetectionResult,
    BusinessNiche,
    create_niche_detection_workflow,
    NICHE_KEYWORDS,
    NICHE_TEMPLATES
)

from .landing_generator import (
    LandingPageGenerator,
    LandingPageConfig,
    create_landing_generator_workflow,
    SECTION_TEMPLATES
)

from .lead_capture import (
    Lead,
    LeadSource,
    LeadQuality,
    LeadStatus,
    LeadQualifier,
    LeadRouter,
    create_lead_capture_workflow
)


def create_workflow_engine(secrets: dict) -> WorkflowEngine:
    """
    Create and configure the workflow engine with all registered workflows.
    
    Args:
        secrets: Dictionary of API keys and secrets
        
    Returns:
        Configured WorkflowEngine instance
    """
    engine = WorkflowEngine(secrets=secrets)
    
    # Register all workflows
    engine.register_workflow(create_niche_detection_workflow())
    engine.register_workflow(create_landing_generator_workflow())
    engine.register_workflow(create_lead_capture_workflow())
    
    return engine


__all__ = [
    # Engine
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
    "StepType",
    
    # Niche Detection
    "NicheDetector",
    "NicheDetectionResult",
    "BusinessNiche",
    "create_niche_detection_workflow",
    "NICHE_KEYWORDS",
    "NICHE_TEMPLATES",
    
    # Landing Generator
    "LandingPageGenerator",
    "LandingPageConfig",
    "create_landing_generator_workflow",
    "SECTION_TEMPLATES",
    
    # Lead Capture
    "Lead",
    "LeadSource",
    "LeadQuality",
    "LeadStatus",
    "LeadQualifier",
    "LeadRouter",
    "create_lead_capture_workflow",
    
    # Factory
    "create_workflow_engine"
]
