"""
Skills Router - API endpoints for skills catalog.

Provides search, autocomplete, and skill management endpoints.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from server.models.skills_models import (
    CategoryResponse,
    SkillSummary,
    SkillDetail,
    SearchRequest,
    SearchResponse,
    AutocompleteRequest,
    AutocompleteResponse,
    SkillStats,
)
from server.services.skills_service import skills_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/skills", tags=["skills"])


# ==================== Initialization ====================

@router.on_event("startup")
async def startup():
    """Initialize skills service on startup."""
    await skills_service.initialize()


# ==================== Search & Autocomplete ====================

@router.get("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum suggestions"),
    include_categories: bool = Query(True, description="Include category suggestions"),
    include_tags: bool = Query(True, description="Include tag suggestions"),
    include_owners: bool = Query(True, description="Include owner suggestions"),
):
    """
    Get autocomplete suggestions for predictive search.

    Returns skill names, categories, and tags matching the query prefix.
    Uses fuzzy matching for typo tolerance.
    """
    try:
        request = AutocompleteRequest(
            query=q,
            limit=limit,
            include_categories=include_categories,
            include_tags=include_tags,
            include_owners=include_owners,
        )
        return await skills_service.autocomplete(request)
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.post("/search", response_model=SearchResponse)
async def search_skills(request: SearchRequest):
    """
    Full-text search with filtering and facets.

    Supports filtering by category, tags, and skill attributes.
    Returns paginated results with relevance ranking.
    """
    try:
        return await skills_service.search(request)
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.get("/search", response_model=SearchResponse)
async def search_skills_get(
    q: str = Query(..., min_length=1, description="Search query"),
    categories: Optional[str] = Query(None, description="Comma-separated category IDs"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    official_only: bool = Query(False),
    verified_only: bool = Query(False),
    featured_only: bool = Query(False),
    sort_by: str = Query("relevance", description="relevance, installs, rating, name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Search skills via GET request.

    Simpler interface for direct browser/curl access.
    """
    try:
        request = SearchRequest(
            query=q,
            categories=categories.split(",") if categories else [],
            tags=tags.split(",") if tags else [],
            official_only=official_only,
            verified_only=verified_only,
            featured_only=featured_only,
            sort_by=sort_by,
            page=page,
            page_size=page_size,
        )
        return await skills_service.search(request)
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


# ==================== Categories ====================

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """
    Get all skill categories.

    Returns categories with skill counts and metadata.
    """
    try:
        return await skills_service.get_categories()
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get categories")


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    """Get a single category by ID."""
    category = await skills_service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.get("/categories/{category_id}/skills", response_model=List[SkillSummary])
async def get_category_skills(
    category_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get skills in a specific category."""
    try:
        return await skills_service.get_skills_by_category(category_id, page, page_size)
    except Exception as e:
        logger.error(f"Get category skills error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get skills")


# ==================== Featured & Trending ====================

@router.get("/featured", response_model=List[SkillSummary])
async def get_featured_skills(
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get featured skills.

    Returns hand-picked, high-quality skills.
    """
    try:
        return await skills_service.get_featured_skills(limit)
    except Exception as e:
        logger.error(f"Get featured error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get featured skills")


@router.get("/trending", response_model=List[SkillSummary])
async def get_trending_skills(
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get trending skills.

    Returns skills with highest recent adoption.
    """
    try:
        return await skills_service.get_trending_skills(limit)
    except Exception as e:
        logger.error(f"Get trending error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get trending skills")


# ==================== Skill Details ====================

@router.get("/skill/{skill_id}", response_model=SkillDetail)
async def get_skill(skill_id: str):
    """
    Get detailed skill information.

    Returns full skill details including documentation links.
    """
    skill = await skills_service.get_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


# ==================== Statistics ====================

@router.get("/stats", response_model=SkillStats)
async def get_stats():
    """
    Get global skill statistics.

    Returns totals, category breakdown, and trending skills.
    """
    try:
        return await skills_service.get_stats()
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get stats")


# ==================== Health Check ====================

@router.get("/health")
async def health_check():
    """Skills service health check."""
    stats = await skills_service.get_stats()
    return {
        "status": "healthy",
        "total_skills": stats.total_skills,
        "total_categories": stats.total_categories,
        "search_index_ready": skills_service._initialized,
    }
