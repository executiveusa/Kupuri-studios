"""
Kupuri Studios - Niche Detector Workflow
=========================================
Detects business niche from input data and classifies for
targeted landing page generation.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional
import re

from .base import (
    WorkflowDefinition,
    WorkflowContext,
    ActionStep,
    ConditionStep,
    StepResult
)


class BusinessNiche(Enum):
    """Supported business niches for landing page generation."""
    
    # Service Industries
    RESTAURANT = "restaurant"
    REAL_ESTATE = "real_estate"
    LEGAL = "legal"
    MEDICAL = "medical"
    DENTAL = "dental"
    FITNESS = "fitness"
    SALON_SPA = "salon_spa"
    AUTOMOTIVE = "automotive"
    HOME_SERVICES = "home_services"
    
    # Professional Services
    CONSULTING = "consulting"
    MARKETING_AGENCY = "marketing_agency"
    TECH_STARTUP = "tech_startup"
    ECOMMERCE = "ecommerce"
    EDUCATION = "education"
    
    # Creative Industries
    PHOTOGRAPHY = "photography"
    VIDEOGRAPHY = "videography"
    DESIGN_STUDIO = "design_studio"
    MUSIC_ENTERTAINMENT = "music_entertainment"
    
    # Local Services
    CLEANING = "cleaning"
    LANDSCAPING = "landscaping"
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    HVAC = "hvac"
    
    # Hospitality
    HOTEL = "hotel"
    VACATION_RENTAL = "vacation_rental"
    TOUR_OPERATOR = "tour_operator"
    EVENT_VENUE = "event_venue"
    
    # Other
    NONPROFIT = "nonprofit"
    CHURCH = "church"
    GENERIC = "generic"


@dataclass
class NicheDetectionResult:
    """Result of niche detection analysis."""
    primary_niche: BusinessNiche
    confidence: float
    secondary_niches: list[tuple[BusinessNiche, float]]
    keywords_found: list[str]
    suggested_landing_template: str
    market_region: str
    language_preference: str
    
    def to_dict(self) -> dict:
        return {
            "primary_niche": self.primary_niche.value,
            "confidence": self.confidence,
            "secondary_niches": [
                {"niche": n.value, "confidence": c}
                for n, c in self.secondary_niches
            ],
            "keywords_found": self.keywords_found,
            "suggested_landing_template": self.suggested_landing_template,
            "market_region": self.market_region,
            "language_preference": self.language_preference
        }


# Keyword mappings for niche detection
NICHE_KEYWORDS = {
    BusinessNiche.RESTAURANT: [
        "restaurant", "restaurante", "comida", "food", "menu", "chef",
        "dining", "cuisine", "taqueria", "cocina", "bar", "cafe", "coffee",
        "bakery", "panaderia", "catering", "delivery", "takeout"
    ],
    BusinessNiche.REAL_ESTATE: [
        "real estate", "bienes raices", "inmobiliaria", "property", "casa",
        "house", "apartment", "departamento", "rent", "sell", "broker",
        "realtor", "mortgage", "hipoteca", "listing", "mls"
    ],
    BusinessNiche.LEGAL: [
        "lawyer", "abogado", "attorney", "legal", "law firm", "bufete",
        "litigation", "divorce", "immigration", "inmigracion", "criminal",
        "personal injury", "accident", "settlement"
    ],
    BusinessNiche.MEDICAL: [
        "doctor", "medical", "clinic", "clinica", "health", "salud",
        "hospital", "physician", "surgery", "treatment", "patient",
        "appointment", "cita", "medicina"
    ],
    BusinessNiche.DENTAL: [
        "dental", "dentist", "dentista", "teeth", "smile", "ortodontia",
        "orthodontics", "cleaning", "whitening", "implant", "crown", "root canal"
    ],
    BusinessNiche.FITNESS: [
        "gym", "fitness", "workout", "exercise", "training", "entrenamiento",
        "yoga", "pilates", "crossfit", "personal trainer", "membership"
    ],
    BusinessNiche.SALON_SPA: [
        "salon", "spa", "beauty", "belleza", "hair", "cabello", "nails",
        "uñas", "massage", "masaje", "facial", "skincare", "stylist"
    ],
    BusinessNiche.AUTOMOTIVE: [
        "auto", "car", "carro", "mechanic", "mecanico", "repair", "oil change",
        "tires", "llantas", "body shop", "detailing", "dealer", "concesionario"
    ],
    BusinessNiche.HOME_SERVICES: [
        "home", "house", "casa", "repair", "maintenance", "handyman",
        "remodeling", "renovation", "contractor", "construction"
    ],
    BusinessNiche.CONSULTING: [
        "consulting", "consultoria", "advisor", "strategy", "business",
        "management", "solution", "enterprise", "professional services"
    ],
    BusinessNiche.MARKETING_AGENCY: [
        "marketing", "agency", "agencia", "digital", "social media", "seo",
        "advertising", "publicidad", "brand", "campaign", "creative"
    ],
    BusinessNiche.TECH_STARTUP: [
        "tech", "software", "app", "startup", "saas", "platform", "ai",
        "machine learning", "cloud", "development", "coding", "api"
    ],
    BusinessNiche.ECOMMERCE: [
        "shop", "store", "tienda", "ecommerce", "products", "buy", "comprar",
        "cart", "checkout", "shipping", "envio", "online store"
    ],
    BusinessNiche.EDUCATION: [
        "school", "escuela", "education", "educacion", "learning", "course",
        "class", "tutor", "academy", "training", "certificate", "degree"
    ],
    BusinessNiche.PHOTOGRAPHY: [
        "photography", "fotografia", "photographer", "fotografo", "photo",
        "portrait", "wedding", "boda", "event", "studio", "session"
    ],
    BusinessNiche.CLEANING: [
        "cleaning", "limpieza", "maid", "janitorial", "housekeeping",
        "commercial cleaning", "residential", "deep clean", "sanitization"
    ],
    BusinessNiche.LANDSCAPING: [
        "landscaping", "jardineria", "lawn", "garden", "jardin", "tree",
        "mowing", "irrigation", "outdoor", "patio"
    ],
    BusinessNiche.PLUMBING: [
        "plumbing", "plomeria", "plumber", "plomero", "drain", "pipe",
        "leak", "faucet", "toilet", "water heater"
    ],
    BusinessNiche.HOTEL: [
        "hotel", "resort", "accommodation", "hospedaje", "room", "habitacion",
        "booking", "reservacion", "amenities", "guest", "huesped"
    ],
    BusinessNiche.VACATION_RENTAL: [
        "vacation", "rental", "airbnb", "vrbo", "beach house", "cabin",
        "getaway", "holiday", "short term", "furnished"
    ],
    BusinessNiche.TOUR_OPERATOR: [
        "tour", "tours", "excursion", "adventure", "travel", "viaje",
        "guide", "guia", "sightseeing", "experience", "booking"
    ]
}

# Landing page template mappings
NICHE_TEMPLATES = {
    BusinessNiche.RESTAURANT: "restaurant-modern",
    BusinessNiche.REAL_ESTATE: "property-showcase",
    BusinessNiche.LEGAL: "professional-trust",
    BusinessNiche.MEDICAL: "healthcare-clean",
    BusinessNiche.DENTAL: "dental-smile",
    BusinessNiche.FITNESS: "fitness-energy",
    BusinessNiche.SALON_SPA: "beauty-elegant",
    BusinessNiche.AUTOMOTIVE: "auto-bold",
    BusinessNiche.HOME_SERVICES: "service-reliable",
    BusinessNiche.CONSULTING: "corporate-minimal",
    BusinessNiche.MARKETING_AGENCY: "creative-dynamic",
    BusinessNiche.TECH_STARTUP: "tech-modern",
    BusinessNiche.ECOMMERCE: "shop-conversion",
    BusinessNiche.EDUCATION: "education-friendly",
    BusinessNiche.PHOTOGRAPHY: "portfolio-visual",
    BusinessNiche.CLEANING: "service-reliable",
    BusinessNiche.LANDSCAPING: "outdoor-fresh",
    BusinessNiche.PLUMBING: "service-reliable",
    BusinessNiche.HOTEL: "hospitality-luxury",
    BusinessNiche.VACATION_RENTAL: "vacation-paradise",
    BusinessNiche.TOUR_OPERATOR: "adventure-exciting",
    BusinessNiche.GENERIC: "business-standard"
}

# Market region detection
MARKET_INDICATORS = {
    "cdmx": ["mexico city", "cdmx", "ciudad de mexico", "df", "distrito federal"],
    "puerto_vallarta": ["puerto vallarta", "pv", "vallarta", "jalisco"],
    "seattle": ["seattle", "washington", "wa", "pacific northwest", "puget sound"],
    "puerto_rico": ["puerto rico", "pr", "san juan", "bayamon"],
    "guam": ["guam", "hagatna", "dededo", "pacific island"],
    "spain": ["spain", "españa", "madrid", "barcelona", "valencia"],
    "colombia": ["colombia", "bogota", "medellin", "cali", "cartagena"],
    "argentina": ["argentina", "buenos aires", "cordoba", "rosario"],
    "chile": ["chile", "santiago", "valparaiso", "concepcion"],
    "peru": ["peru", "lima", "cusco", "arequipa"],
    "panama": ["panama", "ciudad de panama", "colon"]
}


class NicheDetector:
    """
    Detects business niche from various input sources.
    """
    
    def __init__(self):
        self.keyword_map = NICHE_KEYWORDS
        self.template_map = NICHE_TEMPLATES
        self.market_indicators = MARKET_INDICATORS
    
    def detect_from_text(
        self,
        text: str,
        url: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> NicheDetectionResult:
        """Detect niche from text content."""
        
        text_lower = text.lower()
        url_lower = (url or "").lower()
        combined = f"{text_lower} {url_lower}"
        
        # Score each niche
        scores: dict[BusinessNiche, float] = {}
        keywords_found: dict[BusinessNiche, list[str]] = {}
        
        for niche, keywords in self.keyword_map.items():
            score = 0.0
            found = []
            
            for keyword in keywords:
                # Check for exact word matches
                pattern = rf'\b{re.escape(keyword)}\b'
                matches = len(re.findall(pattern, combined, re.IGNORECASE))
                
                if matches > 0:
                    score += matches * (1.5 if len(keyword) > 5 else 1.0)
                    found.append(keyword)
            
            if score > 0:
                scores[niche] = score
                keywords_found[niche] = found
        
        # Determine primary niche
        if not scores:
            primary_niche = BusinessNiche.GENERIC
            confidence = 0.5
            found_keywords = []
        else:
            # Normalize scores
            max_score = max(scores.values())
            normalized = {k: v / max_score for k, v in scores.items()}
            
            # Sort by score
            sorted_niches = sorted(
                normalized.items(),
                key=lambda x: x[1],
                reverse=True
            )
            
            primary_niche = sorted_niches[0][0]
            confidence = min(0.95, sorted_niches[0][1])
            found_keywords = keywords_found.get(primary_niche, [])
        
        # Get secondary niches
        secondary_niches = []
        if len(scores) > 1:
            for niche, score in list(
                sorted(scores.items(), key=lambda x: x[1], reverse=True)
            )[1:4]:
                if score / max(scores.values()) > 0.3:
                    secondary_niches.append(
                        (niche, score / max(scores.values()))
                    )
        
        # Detect market region
        market_region = self._detect_market_region(combined)
        
        # Detect language preference
        language = self._detect_language(text)
        
        return NicheDetectionResult(
            primary_niche=primary_niche,
            confidence=confidence,
            secondary_niches=secondary_niches,
            keywords_found=found_keywords[:10],
            suggested_landing_template=self.template_map.get(
                primary_niche,
                "business-standard"
            ),
            market_region=market_region,
            language_preference=language
        )
    
    def _detect_market_region(self, text: str) -> str:
        """Detect target market region from text."""
        text_lower = text.lower()
        
        for region, indicators in self.market_indicators.items():
            for indicator in indicators:
                if indicator in text_lower:
                    return region
        
        return "global"
    
    def _detect_language(self, text: str) -> str:
        """Simple language detection."""
        spanish_indicators = [
            "de", "el", "la", "en", "que", "los", "del", "para",
            "con", "una", "por", "como", "más", "pero", "sus"
        ]
        
        words = text.lower().split()
        spanish_count = sum(1 for w in words if w in spanish_indicators)
        
        if spanish_count > len(words) * 0.15:
            return "es"
        return "en"


def create_niche_detection_workflow() -> WorkflowDefinition:
    """Create the niche detection workflow."""
    
    detector = NicheDetector()
    
    async def extract_input(ctx: WorkflowContext) -> dict:
        """Extract and normalize input data."""
        return {
            "text": ctx.get("input_text", ""),
            "url": ctx.get("input_url"),
            "business_name": ctx.get("business_name"),
            "metadata": ctx.get("metadata", {})
        }
    
    async def analyze_niche(ctx: WorkflowContext) -> dict:
        """Run niche detection analysis."""
        input_data = ctx.step_results.get("extract_input", {})
        
        # Combine all text sources
        text_parts = [
            input_data.get("text", ""),
            input_data.get("business_name", "")
        ]
        combined_text = " ".join(filter(None, text_parts))
        
        result = detector.detect_from_text(
            text=combined_text,
            url=input_data.get("url"),
            metadata=input_data.get("metadata")
        )
        
        ctx.set("detection_result", result)
        return result.to_dict()
    
    async def prepare_landing_config(ctx: WorkflowContext) -> dict:
        """Prepare landing page configuration based on niche."""
        result = ctx.get("detection_result")
        
        if not result:
            return {"error": "No detection result available"}
        
        return {
            "template": result.suggested_landing_template,
            "primary_niche": result.primary_niche.value,
            "locale": f"{result.language_preference}-{result.market_region.upper()}" 
                     if result.market_region != "global" 
                     else result.language_preference,
            "market_region": result.market_region,
            "confidence": result.confidence,
            "keywords_for_seo": result.keywords_found
        }
    
    workflow = WorkflowDefinition(
        workflow_id="niche_detection",
        name="Niche Detection",
        description="Analyzes business data to detect niche and configure landing page",
        version="1.0.0",
        steps=[
            ActionStep(
                step_id="extract_input",
                action=extract_input,
                name="Extract Input Data",
                description="Extract and normalize all input sources"
            ),
            ActionStep(
                step_id="analyze_niche",
                action=analyze_niche,
                name="Analyze Business Niche",
                description="Run ML-based niche detection"
            ),
            ActionStep(
                step_id="prepare_landing_config",
                action=prepare_landing_config,
                name="Prepare Landing Config",
                description="Generate landing page configuration"
            )
        ],
        triggers=[
            {"type": "api", "endpoint": "/api/workflows/niche-detect"},
            {"type": "webhook", "event": "lead.created"}
        ],
        metadata={
            "category": "lead_processing",
            "author": "kupuri-swarm",
            "markets": ["cdmx", "puerto_vallarta", "seattle", "guam", "puerto_rico"]
        }
    )
    
    return workflow


__all__ = [
    "NicheDetector",
    "NicheDetectionResult",
    "BusinessNiche",
    "create_niche_detection_workflow",
    "NICHE_KEYWORDS",
    "NICHE_TEMPLATES"
]
