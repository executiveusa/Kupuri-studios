"""
Kupuri Studios - Workflow Router
================================
API endpoints for workflow execution and management.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import Any, Optional
import logging

from ..workflows import (
    create_workflow_engine,
    BusinessNiche,
    LeadSource
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workflows", tags=["workflows"])

# Global workflow engine instance (initialized with secrets)
_workflow_engine = None


def get_workflow_engine():
    """Get or create workflow engine instance."""
    global _workflow_engine
    if _workflow_engine is None:
        import os
        secrets = {
            "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY", ""),
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
            "SUPABASE_URL": os.getenv("SUPABASE_URL", ""),
            "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY", ""),
            "TWILIO_ACCOUNT_SID": os.getenv("TWILIO_ACCOUNT_SID", ""),
            "TWILIO_AUTH_TOKEN": os.getenv("TWILIO_AUTH_TOKEN", ""),
        }
        _workflow_engine = create_workflow_engine(secrets)
    return _workflow_engine


# ==================== Request/Response Models ====================

class NicheDetectionRequest(BaseModel):
    """Request for niche detection."""
    text: str = Field(..., description="Text content to analyze")
    url: Optional[str] = Field(None, description="URL associated with the content")
    business_name: Optional[str] = Field(None, description="Business name")


class NicheDetectionResponse(BaseModel):
    """Response from niche detection."""
    primary_niche: str
    confidence: float
    secondary_niches: list[dict]
    keywords_found: list[str]
    suggested_template: str
    market_region: str
    language_preference: str


class LandingPageRequest(BaseModel):
    """Request for landing page generation."""
    business_name: str = Field(..., description="Business name")
    description: Optional[str] = Field("", description="Business description")
    niche: Optional[str] = Field(None, description="Business niche (auto-detected if not provided)")
    market_region: str = Field("global", description="Target market region")
    language: str = Field("en", description="Language code")
    custom_content: Optional[dict] = Field(None, description="Custom content overrides")


class LandingPageResponse(BaseModel):
    """Response from landing page generation."""
    page_id: str
    niche: str
    template: str
    locale: str
    content: dict
    seo: dict
    sections: list[dict]


class LeadCaptureRequest(BaseModel):
    """Request for lead capture."""
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Contact phone")
    name: Optional[str] = Field(None, description="Contact name")
    company: Optional[str] = Field(None, description="Company name")
    message: Optional[str] = Field(None, description="Lead message")
    source: str = Field("website_form", description="Lead source")
    campaign_id: Optional[str] = Field(None, description="Campaign ID")
    landing_page_id: Optional[str] = Field(None, description="Landing page ID")
    utm_params: Optional[dict] = Field(None, description="UTM parameters")
    interests: Optional[list[str]] = Field(None, description="Areas of interest")
    budget: Optional[str] = Field(None, description="Budget range")
    timeline: Optional[str] = Field(None, description="Project timeline")


class LeadCaptureResponse(BaseModel):
    """Response from lead capture."""
    lead_id: str
    quality: str
    score: int
    assigned_to: str
    chatwoot_contact_id: Optional[str]
    status: str


class WorkflowExecutionRequest(BaseModel):
    """Generic workflow execution request."""
    workflow_id: str = Field(..., description="ID of workflow to execute")
    variables: dict = Field(default_factory=dict, description="Input variables")
    metadata: Optional[dict] = Field(None, description="Additional metadata")


class WorkflowExecutionResponse(BaseModel):
    """Response from workflow execution."""
    run_id: str
    workflow_id: str
    status: str
    step_results: dict
    duration_ms: Optional[float] = None
    error: Optional[str] = None


# ==================== Endpoints ====================

@router.get("/")
async def list_workflows():
    """List all available workflows."""
    engine = get_workflow_engine()
    return {
        "workflows": engine.list_workflows(),
        "active_runs": engine.get_active_runs()
    }


@router.post("/niche-detect", response_model=NicheDetectionResponse)
async def detect_niche(request: NicheDetectionRequest):
    """Detect business niche from text content."""
    engine = get_workflow_engine()
    
    try:
        result = await engine.execute(
            workflow_id="niche_detection",
            variables={
                "input_text": request.text,
                "input_url": request.url,
                "business_name": request.business_name
            }
        )
        
        if result["status"] == "failed":
            raise HTTPException(
                status_code=500,
                detail=f"Workflow failed: {result.get('error')}"
            )
        
        detection = result["step_results"].get("analyze_niche", {})
        
        return NicheDetectionResponse(
            primary_niche=detection.get("primary_niche", "generic"),
            confidence=detection.get("confidence", 0.5),
            secondary_niches=detection.get("secondary_niches", []),
            keywords_found=detection.get("keywords_found", []),
            suggested_template=detection.get("suggested_landing_template", "business-standard"),
            market_region=detection.get("market_region", "global"),
            language_preference=detection.get("language_preference", "en")
        )
        
    except Exception as e:
        logger.error(f"Niche detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-landing", response_model=LandingPageResponse)
async def generate_landing_page(request: LandingPageRequest):
    """Generate a landing page configuration."""
    engine = get_workflow_engine()
    
    try:
        result = await engine.execute(
            workflow_id="landing_generator",
            variables={
                "business_name": request.business_name,
                "description": request.description,
                "niche": request.niche,
                "market_region": request.market_region,
                "language": request.language,
                "custom_content": request.custom_content
            }
        )
        
        if result["status"] == "failed":
            raise HTTPException(
                status_code=500,
                detail=f"Workflow failed: {result.get('error')}"
            )
        
        landing = result["step_results"].get("generate_landing_page", {})
        
        return LandingPageResponse(
            page_id=landing.get("page_id", ""),
            niche=landing.get("niche", "generic"),
            template=landing.get("template", "business-standard"),
            locale=landing.get("locale", "en-GLOBAL"),
            content=landing.get("content", {}),
            seo=landing.get("seo", {}),
            sections=landing.get("sections", [])
        )
        
    except Exception as e:
        logger.error(f"Landing page generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/capture-lead", response_model=LeadCaptureResponse)
async def capture_lead(
    request: LeadCaptureRequest,
    background_tasks: BackgroundTasks
):
    """Capture and process a new lead."""
    engine = get_workflow_engine()
    
    try:
        result = await engine.execute(
            workflow_id="lead_capture",
            variables={
                "raw_lead_data": {
                    "email": request.email,
                    "phone": request.phone,
                    "name": request.name,
                    "company": request.company,
                    "message": request.message,
                    "source": request.source,
                    "campaign_id": request.campaign_id,
                    "landing_page_id": request.landing_page_id,
                    "utm_params": request.utm_params or {},
                    "interests": request.interests or [],
                    "budget": request.budget,
                    "timeline": request.timeline
                }
            }
        )
        
        if result["status"] == "failed":
            raise HTTPException(
                status_code=500,
                detail=f"Workflow failed: {result.get('error')}"
            )
        
        parse_result = result["step_results"].get("parse_lead_data", {})
        qualify_result = result["step_results"].get("qualify_lead", {})
        route_result = result["step_results"].get("route_lead", {})
        chatwoot_result = result["step_results"].get("parallel_actions", {}).get(
            "parallel_results", [{}]
        )[0]
        
        return LeadCaptureResponse(
            lead_id=parse_result.get("lead_id", ""),
            quality=qualify_result.get("quality", "cold"),
            score=qualify_result.get("score", 0),
            assigned_to=route_result.get("assigned_to", "default_agent"),
            chatwoot_contact_id=chatwoot_result.get("data", {}).get("chatwoot_contact_id"),
            status="captured"
        )
        
    except Exception as e:
        logger.error(f"Lead capture failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(request: WorkflowExecutionRequest):
    """Execute any registered workflow by ID."""
    engine = get_workflow_engine()
    
    try:
        result = await engine.execute(
            workflow_id=request.workflow_id,
            variables=request.variables,
            metadata=request.metadata
        )
        
        return WorkflowExecutionResponse(
            run_id=result["run_id"],
            workflow_id=result["workflow_id"],
            status=result["status"],
            step_results=result.get("step_results", {}),
            duration_ms=result.get("duration_ms"),
            error=result.get("error")
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/niches")
async def get_available_niches():
    """Get list of available business niches."""
    return {
        "niches": [
            {
                "id": niche.value,
                "name": niche.name.replace("_", " ").title(),
                "category": _get_niche_category(niche)
            }
            for niche in BusinessNiche
        ]
    }


@router.get("/sources")
async def get_lead_sources():
    """Get list of available lead sources."""
    return {
        "sources": [
            {"id": source.value, "name": source.name.replace("_", " ").title()}
            for source in LeadSource
        ]
    }


def _get_niche_category(niche: BusinessNiche) -> str:
    """Get category for a niche."""
    categories = {
        "service_industries": [
            BusinessNiche.RESTAURANT, BusinessNiche.REAL_ESTATE,
            BusinessNiche.LEGAL, BusinessNiche.MEDICAL, BusinessNiche.DENTAL,
            BusinessNiche.FITNESS, BusinessNiche.SALON_SPA, BusinessNiche.AUTOMOTIVE,
            BusinessNiche.HOME_SERVICES
        ],
        "professional_services": [
            BusinessNiche.CONSULTING, BusinessNiche.MARKETING_AGENCY,
            BusinessNiche.TECH_STARTUP, BusinessNiche.ECOMMERCE, BusinessNiche.EDUCATION
        ],
        "creative_industries": [
            BusinessNiche.PHOTOGRAPHY, BusinessNiche.VIDEOGRAPHY,
            BusinessNiche.DESIGN_STUDIO, BusinessNiche.MUSIC_ENTERTAINMENT
        ],
        "local_services": [
            BusinessNiche.CLEANING, BusinessNiche.LANDSCAPING,
            BusinessNiche.PLUMBING, BusinessNiche.ELECTRICAL, BusinessNiche.HVAC
        ],
        "hospitality": [
            BusinessNiche.HOTEL, BusinessNiche.VACATION_RENTAL,
            BusinessNiche.TOUR_OPERATOR, BusinessNiche.EVENT_VENUE
        ]
    }
    
    for category, niches in categories.items():
        if niche in niches:
            return category
    return "other"
