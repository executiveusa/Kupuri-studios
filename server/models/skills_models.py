"""
Pydantic models for the Skills Catalog system.

Supports search, autocomplete, categorization, and installation tracking.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SkillCategory(str, Enum):
    """Top-level skill categories."""
    DEVELOPMENT = "development"
    DESIGN = "design"
    DOCUMENTATION = "documentation"
    SECURITY = "security"
    DEVOPS = "devops"
    DATA = "data"
    AI_ML = "ai_ml"
    MARKETING = "marketing"
    MOBILE = "mobile"
    TESTING = "testing"
    COMMUNICATION = "communication"
    PRODUCTIVITY = "productivity"
    OTHER = "other"


class SupportedAgent(str, Enum):
    """AI agents that can use skills."""
    CLAUDE_CODE = "claude-code"
    CLAUDE_AGENT_SDK = "claude-agent-sdk"
    GITHUB_COPILOT = "github-copilot"
    CURSOR = "cursor"
    WINDSURF = "windsurf"
    OPENCODE = "opencode"
    CODEX = "codex"
    GEMINI = "gemini"
    GOOSE = "goose"
    AIDER = "aider"
    CONTINUE = "continue"
    ALL = "all"


# ==================== Category Models ====================

class CategoryBase(BaseModel):
    """Base category model."""
    name: str = Field(..., description="Category display name")
    slug: str = Field(..., description="URL-friendly identifier")
    description: Optional[str] = None
    icon: Optional[str] = Field(None, description="Icon name or emoji")
    color: Optional[str] = Field(None, description="Hex color code")


class CategoryCreate(CategoryBase):
    """Model for creating a category."""
    parent_id: Optional[str] = None
    sort_order: int = 0


class CategoryResponse(CategoryBase):
    """Category response with metadata."""
    id: str
    parent_id: Optional[str] = None
    sort_order: int = 0
    skill_count: int = 0
    created_at: datetime


class CategoryWithChildren(CategoryResponse):
    """Category with nested subcategories."""
    children: List["CategoryWithChildren"] = []


# ==================== Skill Models ====================

class SkillBase(BaseModel):
    """Base skill model."""
    name: str = Field(..., description="Skill display name")
    slug: str = Field(..., description="URL-friendly identifier")
    owner: str = Field(..., description="GitHub owner/organization")
    repo: str = Field(..., description="GitHub repository name")
    description: Optional[str] = Field(None, description="Short description")
    long_description: Optional[str] = Field(None, description="Detailed description")


class SkillCreate(SkillBase):
    """Model for creating a skill."""
    category_id: Optional[str] = None
    subcategory: Optional[str] = None
    tags: List[str] = []
    supported_agents: List[SupportedAgent] = [SupportedAgent.ALL]
    dependencies: List[str] = []
    version: Optional[str] = None
    documentation_url: Optional[str] = None
    icon_url: Optional[str] = None
    is_official: bool = False
    is_verified: bool = False
    is_featured: bool = False


class SkillUpdate(BaseModel):
    """Model for updating a skill."""
    name: Optional[str] = None
    description: Optional[str] = None
    long_description: Optional[str] = None
    category_id: Optional[str] = None
    subcategory: Optional[str] = None
    tags: Optional[List[str]] = None
    supported_agents: Optional[List[SupportedAgent]] = None
    version: Optional[str] = None
    is_featured: Optional[bool] = None


class SkillSummary(BaseModel):
    """Lightweight skill for list views."""
    id: str
    name: str
    slug: str
    owner: str
    repo: str
    description: Optional[str]
    category_id: Optional[str]
    category_name: Optional[str] = None
    install_command: str
    install_count: int = 0
    is_official: bool = False
    is_verified: bool = False
    is_featured: bool = False
    rating: float = 0.0
    tags: List[str] = []


class SkillDetail(SkillSummary):
    """Full skill details."""
    long_description: Optional[str]
    subcategory: Optional[str]
    supported_agents: List[str] = []
    dependencies: List[str] = []
    version: Optional[str]
    documentation_url: Optional[str]
    source_url: Optional[str]
    icon_url: Optional[str]
    rating_count: int = 0
    created_at: datetime
    updated_at: datetime


class SkillWithCategory(SkillDetail):
    """Skill with full category info."""
    category: Optional[CategoryResponse] = None


# ==================== Search Models ====================

class SearchSuggestion(BaseModel):
    """Autocomplete suggestion."""
    text: str = Field(..., description="Suggested text")
    type: str = Field(..., description="Type: skill, category, tag, owner")
    skill_id: Optional[str] = None
    category_id: Optional[str] = None
    match_score: float = Field(1.0, description="Relevance score 0-1")


class SearchRequest(BaseModel):
    """Search request parameters."""
    query: str = Field(..., min_length=1, description="Search query")
    categories: List[str] = Field([], description="Filter by category IDs")
    tags: List[str] = Field([], description="Filter by tags")
    agents: List[SupportedAgent] = Field([], description="Filter by supported agents")
    official_only: bool = False
    verified_only: bool = False
    featured_only: bool = False
    sort_by: str = Field("relevance", description="relevance, installs, rating, name, recent")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class SearchResponse(BaseModel):
    """Search results with pagination."""
    query: str
    total: int
    page: int
    page_size: int
    total_pages: int
    skills: List[SkillSummary]
    suggestions: List[SearchSuggestion] = []
    facets: Dict[str, List[Dict[str, Any]]] = {}


class AutocompleteRequest(BaseModel):
    """Autocomplete request."""
    query: str = Field(..., min_length=1, max_length=100)
    limit: int = Field(10, ge=1, le=50)
    include_categories: bool = True
    include_tags: bool = True
    include_owners: bool = True


class AutocompleteResponse(BaseModel):
    """Autocomplete suggestions."""
    query: str
    suggestions: List[SearchSuggestion]


# ==================== Installation Models ====================

class SkillInstallRequest(BaseModel):
    """Request to install a skill."""
    skill_id: str
    agent: SupportedAgent = SupportedAgent.CLAUDE_CODE
    config: Optional[Dict[str, Any]] = None


class SkillInstallResponse(BaseModel):
    """Installation result."""
    success: bool
    skill_id: str
    skill_name: str
    install_command: str
    message: str
    installed_at: Optional[datetime] = None


class InstalledSkill(BaseModel):
    """User's installed skill."""
    id: str
    skill: SkillSummary
    installed_at: datetime
    last_used_at: Optional[datetime]
    usage_count: int
    is_enabled: bool
    config: Optional[Dict[str, Any]]


class UserSkillsResponse(BaseModel):
    """User's installed skills list."""
    total: int
    skills: List[InstalledSkill]


# ==================== Rating Models ====================

class SkillRatingRequest(BaseModel):
    """Request to rate a skill."""
    skill_id: str
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5 stars")
    review: Optional[str] = Field(None, max_length=2000)


class SkillRatingResponse(BaseModel):
    """Rating submission result."""
    success: bool
    skill_id: str
    new_rating: float
    total_ratings: int


# ==================== Bulk Import Models ====================

class SkillImportItem(BaseModel):
    """Single skill for bulk import."""
    name: str
    owner: str
    repo: str
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    tags: List[str] = []
    is_official: bool = False
    is_verified: bool = False
    install_count: int = 0


class BulkImportRequest(BaseModel):
    """Bulk import skills."""
    skills: List[SkillImportItem]
    update_existing: bool = False


class BulkImportResponse(BaseModel):
    """Bulk import result."""
    total: int
    imported: int
    updated: int
    skipped: int
    errors: List[Dict[str, str]] = []


# ==================== Stats Models ====================

class SkillStats(BaseModel):
    """Global skill statistics."""
    total_skills: int
    total_categories: int
    total_installs: int
    official_skills: int
    verified_skills: int
    featured_skills: int
    top_categories: List[Dict[str, Any]]
    trending_skills: List[SkillSummary]
    recent_skills: List[SkillSummary]
