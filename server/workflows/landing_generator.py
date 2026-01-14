"""
Kupuri Studios - Landing Page Generator Workflow
=================================================
Generates multi-landing pages per niche with SEO optimization.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
import json

from .base import (
    WorkflowDefinition,
    WorkflowContext,
    ActionStep,
    ConditionStep,
    ParallelStep
)
from .niche_detector import BusinessNiche, NicheDetector, NICHE_TEMPLATES


@dataclass
class LandingPageConfig:
    """Configuration for a generated landing page."""
    page_id: str
    niche: BusinessNiche
    template: str
    locale: str
    market_region: str
    
    # Content
    headline: str
    subheadline: str
    value_props: list[str]
    cta_text: str
    cta_url: str
    
    # SEO
    meta_title: str
    meta_description: str
    keywords: list[str]
    og_image: Optional[str] = None
    
    # Design
    primary_color: str = "#7C3AED"
    secondary_color: str = "#FF6B35"
    font_family: str = "Inter"
    
    # Tracking
    gtm_id: Optional[str] = None
    fb_pixel_id: Optional[str] = None
    
    # Generated assets
    sections: list[dict] = field(default_factory=list)
    schema_markup: Optional[dict] = None
    
    def to_dict(self) -> dict:
        return {
            "page_id": self.page_id,
            "niche": self.niche.value,
            "template": self.template,
            "locale": self.locale,
            "market_region": self.market_region,
            "content": {
                "headline": self.headline,
                "subheadline": self.subheadline,
                "value_props": self.value_props,
                "cta_text": self.cta_text,
                "cta_url": self.cta_url
            },
            "seo": {
                "meta_title": self.meta_title,
                "meta_description": self.meta_description,
                "keywords": self.keywords,
                "og_image": self.og_image
            },
            "design": {
                "primary_color": self.primary_color,
                "secondary_color": self.secondary_color,
                "font_family": self.font_family
            },
            "tracking": {
                "gtm_id": self.gtm_id,
                "fb_pixel_id": self.fb_pixel_id
            },
            "sections": self.sections,
            "schema_markup": self.schema_markup
        }


# Template section definitions
SECTION_TEMPLATES = {
    "restaurant-modern": [
        {"type": "hero", "variant": "image-bg", "features": ["menu-preview", "reservation-cta"]},
        {"type": "menu-showcase", "variant": "grid", "features": ["categories", "prices"]},
        {"type": "about", "variant": "story", "features": ["chef-bio", "history"]},
        {"type": "gallery", "variant": "masonry", "features": ["food-photos", "ambiance"]},
        {"type": "reviews", "variant": "carousel", "features": ["google-reviews", "yelp"]},
        {"type": "location", "variant": "map-hours", "features": ["map", "hours", "parking"]},
        {"type": "cta", "variant": "reservation", "features": ["online-booking", "phone"]}
    ],
    "property-showcase": [
        {"type": "hero", "variant": "property-search", "features": ["search-bar", "filters"]},
        {"type": "featured-listings", "variant": "cards", "features": ["mls-feed", "favorites"]},
        {"type": "agent-profile", "variant": "trust", "features": ["credentials", "awards"]},
        {"type": "testimonials", "variant": "video", "features": ["client-stories"]},
        {"type": "neighborhood-guide", "variant": "tabs", "features": ["schools", "amenities"]},
        {"type": "cta", "variant": "consultation", "features": ["calendar-booking", "contact"]}
    ],
    "professional-trust": [
        {"type": "hero", "variant": "trust-badges", "features": ["credentials", "experience"]},
        {"type": "practice-areas", "variant": "icons", "features": ["specialties"]},
        {"type": "case-results", "variant": "stats", "features": ["wins", "settlements"]},
        {"type": "attorney-profiles", "variant": "team", "features": ["bios", "education"]},
        {"type": "faq", "variant": "accordion", "features": ["common-questions"]},
        {"type": "cta", "variant": "consultation", "features": ["free-consult", "phone"]}
    ],
    "healthcare-clean": [
        {"type": "hero", "variant": "care-focused", "features": ["appointment-cta", "emergency"]},
        {"type": "services", "variant": "medical-icons", "features": ["treatments"]},
        {"type": "providers", "variant": "profiles", "features": ["doctors", "credentials"]},
        {"type": "patient-portal", "variant": "buttons", "features": ["forms", "records"]},
        {"type": "insurance", "variant": "logos", "features": ["accepted-plans"]},
        {"type": "location", "variant": "multi-location", "features": ["all-offices"]}
    ],
    "tech-modern": [
        {"type": "hero", "variant": "product-demo", "features": ["video", "signup-cta"]},
        {"type": "features", "variant": "bento-grid", "features": ["highlights"]},
        {"type": "how-it-works", "variant": "steps", "features": ["process"]},
        {"type": "integrations", "variant": "logo-wall", "features": ["partners"]},
        {"type": "pricing", "variant": "tiers", "features": ["plans", "comparison"]},
        {"type": "testimonials", "variant": "logos-quotes", "features": ["enterprise"]},
        {"type": "cta", "variant": "trial", "features": ["free-trial", "demo"]}
    ],
    "business-standard": [
        {"type": "hero", "variant": "standard", "features": ["headline", "cta"]},
        {"type": "services", "variant": "cards", "features": ["offerings"]},
        {"type": "about", "variant": "simple", "features": ["mission", "values"]},
        {"type": "testimonials", "variant": "simple", "features": ["quotes"]},
        {"type": "contact", "variant": "form", "features": ["form", "info"]}
    ]
}

# CTA text by locale
CTA_TEXT = {
    "en": {
        "book": "Book Now",
        "call": "Call Us Today",
        "contact": "Get in Touch",
        "quote": "Get a Free Quote",
        "consultation": "Schedule Consultation",
        "trial": "Start Free Trial",
        "learn": "Learn More"
    },
    "es": {
        "book": "Reservar Ahora",
        "call": "Llámanos Hoy",
        "contact": "Contáctanos",
        "quote": "Cotización Gratis",
        "consultation": "Agenda Consulta",
        "trial": "Prueba Gratis",
        "learn": "Más Información"
    }
}


class LandingPageGenerator:
    """
    Generates landing page configurations from niche detection results.
    """
    
    def __init__(self):
        self.niche_detector = NicheDetector()
        self.section_templates = SECTION_TEMPLATES
        self.cta_text = CTA_TEXT
    
    def generate_page_id(self, business_name: str, niche: str, market: str) -> str:
        """Generate unique page ID."""
        import hashlib
        base = f"{business_name}-{niche}-{market}-{datetime.utcnow().timestamp()}"
        return hashlib.md5(base.encode()).hexdigest()[:12]
    
    def generate(
        self,
        business_name: str,
        niche: BusinessNiche,
        market_region: str,
        language: str = "en",
        custom_content: Optional[dict] = None
    ) -> LandingPageConfig:
        """Generate a landing page configuration."""
        
        template = NICHE_TEMPLATES.get(niche, "business-standard")
        sections = self.section_templates.get(template, self.section_templates["business-standard"])
        
        # Get locale-specific CTA text
        lang_key = language[:2] if language else "en"
        cta_options = self.cta_text.get(lang_key, self.cta_text["en"])
        
        # Determine best CTA for niche
        niche_ctas = {
            BusinessNiche.RESTAURANT: "book",
            BusinessNiche.REAL_ESTATE: "consultation",
            BusinessNiche.LEGAL: "consultation",
            BusinessNiche.MEDICAL: "book",
            BusinessNiche.TECH_STARTUP: "trial",
            BusinessNiche.ECOMMERCE: "learn"
        }
        cta_key = niche_ctas.get(niche, "contact")
        
        # Build page configuration
        page_id = self.generate_page_id(business_name, niche.value, market_region)
        
        # Default content (can be overridden by custom_content)
        default_headline = self._generate_headline(business_name, niche, lang_key)
        default_subheadline = self._generate_subheadline(niche, lang_key)
        default_value_props = self._generate_value_props(niche, lang_key)
        
        config = LandingPageConfig(
            page_id=page_id,
            niche=niche,
            template=template,
            locale=f"{lang_key}-{market_region.upper()}",
            market_region=market_region,
            headline=custom_content.get("headline", default_headline) if custom_content else default_headline,
            subheadline=custom_content.get("subheadline", default_subheadline) if custom_content else default_subheadline,
            value_props=custom_content.get("value_props", default_value_props) if custom_content else default_value_props,
            cta_text=cta_options[cta_key],
            cta_url=f"/contact?source={page_id}",
            meta_title=f"{business_name} | {self._niche_title(niche, lang_key)}",
            meta_description=self._generate_meta_description(business_name, niche, market_region, lang_key),
            keywords=self._generate_keywords(niche, market_region, lang_key),
            sections=sections,
            schema_markup=self._generate_schema(business_name, niche, market_region)
        )
        
        return config
    
    def _generate_headline(self, business_name: str, niche: BusinessNiche, lang: str) -> str:
        """Generate headline for niche."""
        headlines = {
            "en": {
                BusinessNiche.RESTAURANT: f"Welcome to {business_name}",
                BusinessNiche.REAL_ESTATE: f"Find Your Dream Home with {business_name}",
                BusinessNiche.LEGAL: f"Experienced Legal Representation",
                BusinessNiche.MEDICAL: f"Your Health, Our Priority",
                BusinessNiche.TECH_STARTUP: f"Transform Your Business with {business_name}",
                BusinessNiche.GENERIC: f"Welcome to {business_name}"
            },
            "es": {
                BusinessNiche.RESTAURANT: f"Bienvenidos a {business_name}",
                BusinessNiche.REAL_ESTATE: f"Encuentra Tu Hogar Ideal con {business_name}",
                BusinessNiche.LEGAL: f"Representación Legal Experta",
                BusinessNiche.MEDICAL: f"Tu Salud, Nuestra Prioridad",
                BusinessNiche.TECH_STARTUP: f"Transforma Tu Negocio con {business_name}",
                BusinessNiche.GENERIC: f"Bienvenidos a {business_name}"
            }
        }
        return headlines.get(lang, headlines["en"]).get(niche, headlines[lang][BusinessNiche.GENERIC])
    
    def _generate_subheadline(self, niche: BusinessNiche, lang: str) -> str:
        """Generate subheadline for niche."""
        subheadlines = {
            "en": {
                BusinessNiche.RESTAURANT: "Authentic flavors, memorable experiences",
                BusinessNiche.REAL_ESTATE: "Expert guidance for every step of your journey",
                BusinessNiche.LEGAL: "Fighting for your rights since day one",
                BusinessNiche.MEDICAL: "Compassionate care, modern medicine",
                BusinessNiche.TECH_STARTUP: "Innovation that drives results",
                BusinessNiche.GENERIC: "Quality service you can trust"
            },
            "es": {
                BusinessNiche.RESTAURANT: "Sabores auténticos, experiencias memorables",
                BusinessNiche.REAL_ESTATE: "Guía experta en cada paso del camino",
                BusinessNiche.LEGAL: "Luchando por tus derechos desde el primer día",
                BusinessNiche.MEDICAL: "Atención compasiva, medicina moderna",
                BusinessNiche.TECH_STARTUP: "Innovación que genera resultados",
                BusinessNiche.GENERIC: "Servicio de calidad en el que puedes confiar"
            }
        }
        return subheadlines.get(lang, subheadlines["en"]).get(niche, subheadlines[lang][BusinessNiche.GENERIC])
    
    def _generate_value_props(self, niche: BusinessNiche, lang: str) -> list[str]:
        """Generate value propositions for niche."""
        props = {
            "en": {
                BusinessNiche.RESTAURANT: [
                    "Fresh, locally-sourced ingredients",
                    "Award-winning chef and team",
                    "Private dining available"
                ],
                BusinessNiche.REAL_ESTATE: [
                    "Local market expertise",
                    "Personalized property matching",
                    "Stress-free closing process"
                ],
                BusinessNiche.GENERIC: [
                    "Professional service",
                    "Customer satisfaction guaranteed",
                    "Competitive pricing"
                ]
            },
            "es": {
                BusinessNiche.RESTAURANT: [
                    "Ingredientes frescos y locales",
                    "Chef y equipo galardonados",
                    "Comedor privado disponible"
                ],
                BusinessNiche.REAL_ESTATE: [
                    "Experiencia en el mercado local",
                    "Búsqueda personalizada",
                    "Proceso de cierre sin estrés"
                ],
                BusinessNiche.GENERIC: [
                    "Servicio profesional",
                    "Satisfacción garantizada",
                    "Precios competitivos"
                ]
            }
        }
        return props.get(lang, props["en"]).get(niche, props[lang][BusinessNiche.GENERIC])
    
    def _niche_title(self, niche: BusinessNiche, lang: str) -> str:
        """Get niche display title."""
        titles = {
            "en": {
                BusinessNiche.RESTAURANT: "Fine Dining",
                BusinessNiche.REAL_ESTATE: "Real Estate",
                BusinessNiche.LEGAL: "Law Firm",
                BusinessNiche.MEDICAL: "Healthcare",
                BusinessNiche.TECH_STARTUP: "Technology",
                BusinessNiche.GENERIC: "Business"
            },
            "es": {
                BusinessNiche.RESTAURANT: "Restaurante",
                BusinessNiche.REAL_ESTATE: "Bienes Raíces",
                BusinessNiche.LEGAL: "Despacho Legal",
                BusinessNiche.MEDICAL: "Salud",
                BusinessNiche.TECH_STARTUP: "Tecnología",
                BusinessNiche.GENERIC: "Negocio"
            }
        }
        return titles.get(lang, titles["en"]).get(niche, titles[lang][BusinessNiche.GENERIC])
    
    def _generate_meta_description(
        self,
        business_name: str,
        niche: BusinessNiche,
        market: str,
        lang: str
    ) -> str:
        """Generate SEO meta description."""
        market_names = {
            "cdmx": "Mexico City",
            "puerto_vallarta": "Puerto Vallarta",
            "seattle": "Seattle",
            "puerto_rico": "Puerto Rico",
            "guam": "Guam"
        }
        market_name = market_names.get(market, market.replace("_", " ").title())
        
        if lang == "es":
            return f"{business_name} - {self._niche_title(niche, lang)} en {market_name}. Contáctanos hoy para más información."
        return f"{business_name} - Premier {self._niche_title(niche, lang)} in {market_name}. Contact us today to learn more."
    
    def _generate_keywords(
        self,
        niche: BusinessNiche,
        market: str,
        lang: str
    ) -> list[str]:
        """Generate SEO keywords."""
        from .niche_detector import NICHE_KEYWORDS
        
        base_keywords = NICHE_KEYWORDS.get(niche, [])[:5]
        market_keyword = market.replace("_", " ")
        
        keywords = [f"{kw} {market_keyword}" for kw in base_keywords]
        keywords.extend(base_keywords[:3])
        
        return keywords
    
    def _generate_schema(
        self,
        business_name: str,
        niche: BusinessNiche,
        market: str
    ) -> dict:
        """Generate JSON-LD schema markup."""
        schema_types = {
            BusinessNiche.RESTAURANT: "Restaurant",
            BusinessNiche.REAL_ESTATE: "RealEstateAgent",
            BusinessNiche.LEGAL: "LegalService",
            BusinessNiche.MEDICAL: "MedicalBusiness",
            BusinessNiche.DENTAL: "Dentist",
            BusinessNiche.FITNESS: "HealthClub",
            BusinessNiche.SALON_SPA: "BeautySalon",
            BusinessNiche.HOTEL: "Hotel"
        }
        
        schema_type = schema_types.get(niche, "LocalBusiness")
        
        return {
            "@context": "https://schema.org",
            "@type": schema_type,
            "name": business_name,
            "areaServed": market.replace("_", " ").title()
        }


def create_landing_generator_workflow() -> WorkflowDefinition:
    """Create the landing page generator workflow."""
    
    generator = LandingPageGenerator()
    
    async def validate_input(ctx: WorkflowContext) -> dict:
        """Validate required input parameters."""
        required = ["business_name"]
        missing = [r for r in required if not ctx.get(r)]
        
        if missing:
            raise ValueError(f"Missing required fields: {missing}")
        
        return {
            "business_name": ctx.get("business_name"),
            "description": ctx.get("description", ""),
            "market_region": ctx.get("market_region", "global"),
            "language": ctx.get("language", "en"),
            "custom_content": ctx.get("custom_content")
        }
    
    async def detect_niche(ctx: WorkflowContext) -> dict:
        """Detect business niche if not provided."""
        input_data = ctx.step_results.get("validate_input", {})
        
        if ctx.get("niche"):
            # Use provided niche
            niche = BusinessNiche(ctx.get("niche"))
        else:
            # Detect from description
            detector = NicheDetector()
            result = detector.detect_from_text(
                text=f"{input_data['business_name']} {input_data['description']}",
                metadata={"market": input_data["market_region"]}
            )
            niche = result.primary_niche
        
        ctx.set("detected_niche", niche)
        return {"niche": niche.value, "source": "provided" if ctx.get("niche") else "detected"}
    
    async def generate_landing_page(ctx: WorkflowContext) -> dict:
        """Generate the landing page configuration."""
        input_data = ctx.step_results.get("validate_input", {})
        niche = ctx.get("detected_niche")
        
        config = generator.generate(
            business_name=input_data["business_name"],
            niche=niche,
            market_region=input_data["market_region"],
            language=input_data["language"],
            custom_content=input_data.get("custom_content")
        )
        
        ctx.set("landing_page_config", config)
        return config.to_dict()
    
    async def save_to_database(ctx: WorkflowContext) -> dict:
        """Save landing page config to database (placeholder)."""
        config = ctx.get("landing_page_config")
        
        # This would actually save to Supabase
        # For now, return success indication
        return {
            "saved": True,
            "page_id": config.page_id if config else None,
            "storage": "supabase"
        }
    
    workflow = WorkflowDefinition(
        workflow_id="landing_generator",
        name="Landing Page Generator",
        description="Generates landing page configurations for any business niche",
        version="1.0.0",
        steps=[
            ActionStep(
                step_id="validate_input",
                action=validate_input,
                name="Validate Input",
                description="Validate required input parameters"
            ),
            ActionStep(
                step_id="detect_niche",
                action=detect_niche,
                name="Detect Niche",
                description="Detect or validate business niche"
            ),
            ActionStep(
                step_id="generate_landing_page",
                action=generate_landing_page,
                name="Generate Landing Page",
                description="Generate complete landing page configuration"
            ),
            ActionStep(
                step_id="save_to_database",
                action=save_to_database,
                name="Save to Database",
                description="Persist landing page configuration"
            )
        ],
        triggers=[
            {"type": "api", "endpoint": "/api/workflows/generate-landing"},
            {"type": "webhook", "event": "client.onboarded"}
        ],
        metadata={
            "category": "content_generation",
            "author": "kupuri-swarm",
            "output": "landing_page_config"
        }
    )
    
    return workflow


__all__ = [
    "LandingPageGenerator",
    "LandingPageConfig",
    "create_landing_generator_workflow",
    "SECTION_TEMPLATES"
]
