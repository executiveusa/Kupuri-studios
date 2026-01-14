"""
Kupuri Studios - Lead Capture Workflow
======================================
Captures, qualifies, and routes leads with Chatwoot integration.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional
import re

from .base import (
    WorkflowDefinition,
    WorkflowContext,
    ActionStep,
    ConditionStep,
    ParallelStep
)
from .niche_detector import BusinessNiche


class LeadSource(Enum):
    """Lead acquisition sources."""
    WEBSITE_FORM = "website_form"
    CHAT_WIDGET = "chat_widget"
    WHATSAPP = "whatsapp"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    GOOGLE_ADS = "google_ads"
    FACEBOOK_ADS = "facebook_ads"
    REFERRAL = "referral"
    ORGANIC = "organic"
    EMAIL = "email"
    PHONE = "phone"
    API = "api"


class LeadQuality(Enum):
    """Lead qualification scores."""
    HOT = "hot"  # Ready to buy/convert
    WARM = "warm"  # Interested, needs nurturing
    COLD = "cold"  # Low intent, needs education
    UNQUALIFIED = "unqualified"  # Not a fit


class LeadStatus(Enum):
    """Lead pipeline status."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


@dataclass
class Lead:
    """Lead data model."""
    lead_id: str
    
    # Contact info
    email: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    company: Optional[str] = None
    
    # Source tracking
    source: LeadSource = LeadSource.WEBSITE_FORM
    campaign_id: Optional[str] = None
    landing_page_id: Optional[str] = None
    utm_params: dict = field(default_factory=dict)
    
    # Qualification
    quality: LeadQuality = LeadQuality.COLD
    score: int = 0
    niche: Optional[BusinessNiche] = None
    
    # Pipeline
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[str] = None
    
    # Engagement
    message: Optional[str] = None
    interests: list[str] = field(default_factory=list)
    budget: Optional[str] = None
    timeline: Optional[str] = None
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict = field(default_factory=dict)
    
    # Chatwoot
    chatwoot_contact_id: Optional[str] = None
    chatwoot_conversation_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "lead_id": self.lead_id,
            "contact": {
                "email": self.email,
                "phone": self.phone,
                "name": self.name,
                "company": self.company
            },
            "source": {
                "type": self.source.value,
                "campaign_id": self.campaign_id,
                "landing_page_id": self.landing_page_id,
                "utm_params": self.utm_params
            },
            "qualification": {
                "quality": self.quality.value,
                "score": self.score,
                "niche": self.niche.value if self.niche else None
            },
            "pipeline": {
                "status": self.status.value,
                "assigned_to": self.assigned_to
            },
            "engagement": {
                "message": self.message,
                "interests": self.interests,
                "budget": self.budget,
                "timeline": self.timeline
            },
            "chatwoot": {
                "contact_id": self.chatwoot_contact_id,
                "conversation_id": self.chatwoot_conversation_id
            },
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class LeadQualifier:
    """
    Qualifies leads based on various signals.
    """
    
    # Keywords indicating high intent
    HIGH_INTENT_KEYWORDS = [
        "buy", "comprar", "purchase", "price", "precio", "cost", "costo",
        "quote", "cotizacion", "ready", "listo", "today", "hoy", "now", "ahora",
        "urgent", "urgente", "asap", "need", "necesito", "want", "quiero",
        "schedule", "agendar", "book", "reservar", "hire", "contratar"
    ]
    
    # Keywords indicating research phase
    RESEARCH_KEYWORDS = [
        "information", "informacion", "learn", "aprender", "about", "sobre",
        "compare", "comparar", "options", "opciones", "what is", "que es",
        "how does", "como funciona", "difference", "diferencia"
    ]
    
    def qualify(self, lead: Lead) -> tuple[LeadQuality, int]:
        """Qualify a lead and return quality + score."""
        score = 0
        
        # Contact info scoring
        if lead.email:
            score += 10
            if self._is_business_email(lead.email):
                score += 15
        
        if lead.phone:
            score += 10
        
        if lead.name:
            score += 5
        
        if lead.company:
            score += 10
        
        # Message analysis
        if lead.message:
            message_lower = lead.message.lower()
            
            # High intent keywords
            high_intent_count = sum(
                1 for kw in self.HIGH_INTENT_KEYWORDS
                if kw in message_lower
            )
            score += high_intent_count * 10
            
            # Research keywords (lower score)
            research_count = sum(
                1 for kw in self.RESEARCH_KEYWORDS
                if kw in message_lower
            )
            score += research_count * 3
            
            # Message length (engagement indicator)
            if len(lead.message) > 100:
                score += 5
            if len(lead.message) > 300:
                score += 10
        
        # Budget mention
        if lead.budget:
            score += 20
            budget_lower = lead.budget.lower()
            if any(x in budget_lower for x in ["$", "k", "mil", "thousand"]):
                score += 10
        
        # Timeline mention
        if lead.timeline:
            score += 15
            timeline_lower = lead.timeline.lower()
            if any(x in timeline_lower for x in ["week", "semana", "today", "hoy", "asap"]):
                score += 15
        
        # Source scoring
        source_scores = {
            LeadSource.PHONE: 30,
            LeadSource.WHATSAPP: 25,
            LeadSource.REFERRAL: 25,
            LeadSource.CHAT_WIDGET: 20,
            LeadSource.GOOGLE_ADS: 15,
            LeadSource.FACEBOOK_ADS: 10,
            LeadSource.WEBSITE_FORM: 10,
            LeadSource.ORGANIC: 5
        }
        score += source_scores.get(lead.source, 5)
        
        # Determine quality tier
        if score >= 70:
            quality = LeadQuality.HOT
        elif score >= 40:
            quality = LeadQuality.WARM
        elif score >= 20:
            quality = LeadQuality.COLD
        else:
            quality = LeadQuality.UNQUALIFIED
        
        return quality, min(score, 100)
    
    def _is_business_email(self, email: str) -> bool:
        """Check if email is business (not free provider)."""
        free_providers = [
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
            "aol.com", "icloud.com", "mail.com", "protonmail.com"
        ]
        domain = email.split("@")[-1].lower() if "@" in email else ""
        return domain not in free_providers


class LeadRouter:
    """
    Routes leads to appropriate handlers/agents.
    """
    
    def __init__(self):
        # Agent assignments by niche and quality
        self.routing_rules = {
            # Hot leads go to closers
            LeadQuality.HOT: {
                "default": "closer_agent",
                BusinessNiche.REAL_ESTATE: "real_estate_closer",
                BusinessNiche.LEGAL: "legal_intake_specialist",
                BusinessNiche.MEDICAL: "patient_coordinator"
            },
            # Warm leads go to nurturers
            LeadQuality.WARM: {
                "default": "nurture_agent",
                BusinessNiche.TECH_STARTUP: "demo_scheduler",
                BusinessNiche.ECOMMERCE: "sales_agent"
            },
            # Cold leads go to qualification
            LeadQuality.COLD: {
                "default": "qualification_agent"
            },
            # Unqualified to marketing
            LeadQuality.UNQUALIFIED: {
                "default": "marketing_automation"
            }
        }
    
    def route(self, lead: Lead) -> str:
        """Determine the handler for a lead."""
        quality_rules = self.routing_rules.get(lead.quality, {})
        
        if lead.niche and lead.niche in quality_rules:
            return quality_rules[lead.niche]
        
        return quality_rules.get("default", "default_agent")


def create_lead_capture_workflow() -> WorkflowDefinition:
    """Create the lead capture workflow."""
    
    qualifier = LeadQualifier()
    router = LeadRouter()
    
    async def parse_lead_data(ctx: WorkflowContext) -> dict:
        """Parse and validate incoming lead data."""
        import uuid
        
        raw_data = ctx.get("raw_lead_data", {})
        
        # Generate lead ID
        lead_id = str(uuid.uuid4())[:12]
        
        # Parse source
        source_str = raw_data.get("source", "website_form").lower()
        try:
            source = LeadSource(source_str)
        except ValueError:
            source = LeadSource.WEBSITE_FORM
        
        # Create lead object
        lead = Lead(
            lead_id=lead_id,
            email=raw_data.get("email"),
            phone=raw_data.get("phone"),
            name=raw_data.get("name"),
            company=raw_data.get("company"),
            source=source,
            campaign_id=raw_data.get("campaign_id"),
            landing_page_id=raw_data.get("landing_page_id"),
            utm_params=raw_data.get("utm_params", {}),
            message=raw_data.get("message"),
            interests=raw_data.get("interests", []),
            budget=raw_data.get("budget"),
            timeline=raw_data.get("timeline"),
            metadata=raw_data.get("metadata", {})
        )
        
        ctx.set("lead", lead)
        return {"lead_id": lead_id, "parsed": True}
    
    async def qualify_lead(ctx: WorkflowContext) -> dict:
        """Qualify the lead."""
        lead = ctx.get("lead")
        
        if not lead:
            raise ValueError("No lead data available")
        
        quality, score = qualifier.qualify(lead)
        
        lead.quality = quality
        lead.score = score
        
        ctx.set("lead", lead)
        return {
            "quality": quality.value,
            "score": score,
            "qualified": quality != LeadQuality.UNQUALIFIED
        }
    
    async def route_lead(ctx: WorkflowContext) -> dict:
        """Route lead to appropriate handler."""
        lead = ctx.get("lead")
        
        assigned_to = router.route(lead)
        lead.assigned_to = assigned_to
        
        ctx.set("lead", lead)
        return {
            "assigned_to": assigned_to,
            "routing_reason": f"Quality: {lead.quality.value}, Niche: {lead.niche.value if lead.niche else 'unknown'}"
        }
    
    async def create_chatwoot_contact(ctx: WorkflowContext) -> dict:
        """Create contact in Chatwoot (placeholder)."""
        lead = ctx.get("lead")
        
        # This would actually call Chatwoot API
        # For now, simulate success
        chatwoot_contact_id = f"cw_{lead.lead_id}"
        
        lead.chatwoot_contact_id = chatwoot_contact_id
        ctx.set("lead", lead)
        
        return {
            "chatwoot_contact_id": chatwoot_contact_id,
            "created": True
        }
    
    async def send_notifications(ctx: WorkflowContext) -> dict:
        """Send notifications for new lead."""
        lead = ctx.get("lead")
        
        notifications_sent = []
        
        # Hot leads: immediate notification
        if lead.quality == LeadQuality.HOT:
            notifications_sent.append({
                "type": "push",
                "recipient": lead.assigned_to,
                "message": f"🔥 Hot lead: {lead.name or lead.email}",
                "priority": "high"
            })
        
        # All leads: email notification
        notifications_sent.append({
            "type": "email",
            "recipient": "leads@kupuri.studio",
            "subject": f"New {lead.quality.value} lead from {lead.source.value}"
        })
        
        return {
            "notifications_sent": len(notifications_sent),
            "notifications": notifications_sent
        }
    
    async def save_lead(ctx: WorkflowContext) -> dict:
        """Save lead to database (placeholder)."""
        lead = ctx.get("lead")
        
        # This would save to Supabase
        return {
            "saved": True,
            "lead_id": lead.lead_id,
            "storage": "supabase"
        }
    
    async def trigger_automations(ctx: WorkflowContext) -> dict:
        """Trigger appropriate automations based on lead quality."""
        lead = ctx.get("lead")
        
        automations = []
        
        # Quality-based automations
        if lead.quality == LeadQuality.HOT:
            automations.append({
                "type": "sms",
                "template": "hot_lead_response",
                "delay_minutes": 0
            })
        elif lead.quality == LeadQuality.WARM:
            automations.append({
                "type": "email",
                "template": "warm_lead_nurture",
                "delay_minutes": 30
            })
        else:
            automations.append({
                "type": "email",
                "template": "cold_lead_education",
                "delay_minutes": 60
            })
        
        return {
            "automations_triggered": len(automations),
            "automations": automations
        }
    
    workflow = WorkflowDefinition(
        workflow_id="lead_capture",
        name="Lead Capture & Routing",
        description="Captures, qualifies, and routes leads with Chatwoot integration",
        version="1.0.0",
        steps=[
            ActionStep(
                step_id="parse_lead_data",
                action=parse_lead_data,
                name="Parse Lead Data",
                description="Parse and validate incoming lead data"
            ),
            ActionStep(
                step_id="qualify_lead",
                action=qualify_lead,
                name="Qualify Lead",
                description="Score and qualify the lead"
            ),
            ActionStep(
                step_id="route_lead",
                action=route_lead,
                name="Route Lead",
                description="Route lead to appropriate handler"
            ),
            ParallelStep(
                step_id="parallel_actions",
                steps=[
                    ActionStep(
                        step_id="create_chatwoot_contact",
                        action=create_chatwoot_contact,
                        name="Create Chatwoot Contact"
                    ),
                    ActionStep(
                        step_id="send_notifications",
                        action=send_notifications,
                        name="Send Notifications"
                    )
                ],
                name="Parallel Actions",
                description="Create contact and send notifications in parallel"
            ),
            ActionStep(
                step_id="save_lead",
                action=save_lead,
                name="Save Lead",
                description="Persist lead to database"
            ),
            ActionStep(
                step_id="trigger_automations",
                action=trigger_automations,
                name="Trigger Automations",
                description="Start appropriate follow-up automations"
            )
        ],
        triggers=[
            {"type": "api", "endpoint": "/api/workflows/capture-lead"},
            {"type": "webhook", "event": "form.submitted"},
            {"type": "webhook", "event": "chat.started"},
            {"type": "webhook", "event": "chatwoot.message.created"}
        ],
        metadata={
            "category": "lead_management",
            "author": "kupuri-swarm",
            "integrations": ["chatwoot", "twilio", "supabase"]
        }
    )
    
    return workflow


__all__ = [
    "Lead",
    "LeadSource",
    "LeadQuality",
    "LeadStatus",
    "LeadQualifier",
    "LeadRouter",
    "create_lead_capture_workflow"
]
