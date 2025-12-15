"""
LiteLLM Router - Unified model access and cost optimization
Provides endpoints for:
- Dynamic model catalog fetching
- Cost tracking and usage reporting
- Free-tier routing intelligence
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
import httpx
import os
from services.config_service import config_service

router = APIRouter(prefix="/api/litellm", tags=["litellm"])


@router.get("/models")
async def list_litellm_models() -> Dict:
    """
    Fetch available models from LiteLLM proxy.
    Returns categorized model list with pricing and capability metadata.
    """
    try:
        litellm_config = config_service.get_config().get('litellm', {})
        proxy_url = litellm_config.get('url', 'http://localhost:4000')
        api_key = litellm_config.get('api_key', '')
        
        # Fetch models from LiteLLM /models endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{proxy_url}/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0
            )
            response.raise_for_status()
            models_data = response.json()
        
        # Categorize models by type and cost
        categorized = {
            "free_tier": [],
            "vision": [],
            "premium": [],
            "all": models_data.get("data", [])
        }
        
        for model in models_data.get("data", []):
            model_id = model.get("id", "")
            
            # Identify free-tier models
            if any(free_id in model_id.lower() for free_id in [
                "gemini-2.0-flash", "gemini-1.5-flash", "deepseek", ":free"
            ]):
                categorized["free_tier"].append(model)
            
            # Identify vision-capable models
            if any(vision_id in model_id.lower() for vision_id in [
                "gpt-4o", "claude-3", "gemini", "glm-4v"
            ]):
                categorized["vision"].append(model)
            
            # Premium models (everything else)
            if model_id not in [m.get("id") for m in categorized["free_tier"]]:
                categorized["premium"].append(model)
        
        return {
            "status": "success",
            "models": categorized,
            "cost_optimization_enabled": litellm_config.get('cost_optimization', False)
        }
    
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail=f"LiteLLM proxy unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching models: {str(e)}"
        )


@router.get("/usage")
async def get_usage_stats(
    user_id: Optional[str] = None,
    days: int = 7
) -> Dict:
    """
    Get usage statistics and cost breakdown.
    Returns spend by model, provider, and time period.
    """
    try:
        litellm_config = config_service.get_config().get('litellm', {})
        proxy_url = litellm_config.get('url', 'http://localhost:4000')
        api_key = litellm_config.get('api_key', '')
        
        # Fetch usage from LiteLLM /spend endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{proxy_url}/spend",
                headers={"Authorization": f"Bearer {api_key}"},
                params={"user_id": user_id, "days": days} if user_id else {"days": days},
                timeout=10.0
            )
            response.raise_for_status()
            usage_data = response.json()
        
        return {
            "status": "success",
            "usage": usage_data,
            "savings_via_free_tier": calculate_savings(usage_data)
        }
    
    except httpx.HTTPError as e:
        # If LiteLLM doesn't support usage tracking, return placeholder
        return {
            "status": "partial",
            "message": "Usage tracking not available from LiteLLM proxy",
            "usage": {"total_cost": 0, "requests": 0}
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching usage: {str(e)}"
        )


@router.post("/optimize-routing")
async def update_routing_policy(
    enable_free_tier: bool = True,
    upgrade_for_vision: bool = True,
    budget_limit_monthly: Optional[float] = None
) -> Dict:
    """
    Update cost optimization routing policy.
    Controls when to use free models vs paid models.
    """
    try:
        config = config_service.get_config()
        litellm_config = config.get('litellm', {})
        
        # Update routing settings
        litellm_config['cost_optimization'] = enable_free_tier
        litellm_config['upgrade_for_vision'] = upgrade_for_vision
        litellm_config['budget_limit_monthly'] = budget_limit_monthly
        
        config['litellm'] = litellm_config
        await config_service.update_config(config)
        
        return {
            "status": "success",
            "message": "Routing policy updated",
            "policy": {
                "free_tier_enabled": enable_free_tier,
                "vision_upgrade": upgrade_for_vision,
                "budget_limit": budget_limit_monthly
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating policy: {str(e)}"
        )


def calculate_savings(usage_data: Dict) -> Dict:
    """
    Calculate cost savings from using free-tier models.
    Estimates how much would have been spent on paid alternatives.
    """
    # Simple heuristic: assume free requests would cost $0.001/request on paid tier
    free_requests = usage_data.get("free_requests", 0)
    estimated_savings = free_requests * 0.001
    
    return {
        "free_requests_count": free_requests,
        "estimated_savings_usd": round(estimated_savings, 2),
        "message": f"Saved ~${estimated_savings:.2f} by using free-tier models"
    }


@router.get("/health")
async def litellm_health_check() -> Dict:
    """
    Check if LiteLLM proxy is reachable and configured.
    """
    try:
        litellm_config = config_service.get_config().get('litellm', {})
        proxy_url = litellm_config.get('url', 'http://localhost:4000')
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{proxy_url}/health", timeout=5.0)
            response.raise_for_status()
        
        return {
            "status": "healthy",
            "proxy_url": proxy_url,
            "message": "LiteLLM proxy is reachable"
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"LiteLLM proxy not available: {str(e)}",
            "fallback": "Using direct provider connections"
        }
