"""
Playwright Automation Router
Provides endpoints for browser automation, screenshot capture, and form filling
Integrates with Playwright MCP service for automated testing and deployment
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Optional
import logging

# Service imports
from services.playwright_mcp_service import playwright_mcp_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/playwright",
    tags=["playwright", "automation", "browser", "testing"]
)

# ===========================================
# REQUEST MODELS
# ===========================================

class NavigateURLRequest(BaseModel):
    url: str = Field(..., description="URL to navigate to")
    wait_for_selector: str = Field("body", description="CSS selector to wait for (body, h1, etc.)")
    timeout: int = Field(5000, description="Maximum time to wait in milliseconds")

class ScreenshotRequest(BaseModel):
    url: Optional[str] = Field(None, description="URL to screenshot (optional if page already loaded)")
    filename: Optional[str] = Field(None, description="Filename for screenshot")

class FillFormRequest(BaseModel):
    url: str = Field(..., description="Page URL with form to fill")
    form_data: Dict = Field(..., description="Form field names and values")
    submit: bool = Field(False, description="Whether to submit form after filling")

class TestSuiteRequest(BaseModel):
    test_url: str = Field(..., description="Base URL for testing")

class VercelDeployTestRequest(BaseModel):
    vercel_url: str = Field(..., description="Production Vercel deployment URL")

# ===========================================
# NAVIGATION ENDPOINTS
# ===========================================

@router.post("/navigate")
async def navigate_to_page(request: NavigateURLRequest):
    """
    Navigate to URL and wait for element to load
    
    Request:
        URL to navigate to and CSS selector to wait for
        
    Returns:
        Navigation result with URL and status
    """
    try:
        logger.info(f"Navigating to: {request.url}")
        
        result = await playwright_mcp_service.navigate_to_url(
            url=request.url,
            wait_for_selector=request.wait_for_selector,
            timeout=request.timeout
        )
        
        return {
            "success": result.get("ready", False),
            "url": result.get("url"),
            "status": result.get("status", "unknown"),
            "ready": result.get("ready", False),
            "error": None
        }
        
    except Exception as e:
        logger.error(f"❌ Navigation failed for {request.url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/screenshot")
async def take_page_screenshot(request: ScreenshotRequest):
    """
    Take screenshot of current page or specific URL
    
    Request:
        URL to screenshot (optional if page already loaded)
        Filename for screenshot (auto-generated if not provided)
        
    Returns:
        Screenshot result with file path
    """
    try:
        logger.info(f"Taking screenshot of: {request.url}")
        
        result = await playwright_mcp_service.take_screenshot(
            url=request.url,
            filename=request.filename
        )
        
        return {
            "success": True,
            "screenshot_path": result.get("screenshot_path"),
            "url": result.get("url"),
            "filename": result.get("filename"),
            "created_at": "2026-01-13T12:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"❌ Screenshot failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================
# FORM AUTOMATION ENDPOINTS
# ===========================================

@router.post("/fill-form")
async def fill_and_submit_form(request: FillFormRequest):
    """
    Fill form fields and optionally submit
    
    Request:
        Page URL with form
        Dictionary of form field names and values
        Whether to submit form after filling
        
    Returns:
        Form fill result
    """
    try:
        logger.info(f"Filling form at: {request.url} with {len(request.form_data)} fields")
        
        result = await playwright_mcp_service.fill_form(
            url=request.url,
            form_data=request.form_data,
            submit=request.submit
        )
        
        return {
            "success": True,
            "url": result.get("url"),
            "fields_filled": result.get("fields_filled"),
            "submitted": result.get("submitted"),
            "form_data": request.form_data
        }
        
    except Exception as e:
        logger.error(f"❌ Form filling failed for {request.url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================
# TESTING ENDPOINTS
# ===========================================

@router.post("/test-suite")
async def execute_test_suite(request: TestSuiteRequest):
    """
    Execute automated test suite
    
    Request:
        Base URL for testing
        
    Returns:
        Test results with screenshots
    """
    try:
        logger.info(f"Executing test suite for: {request.test_url}")
        
        result = await playwright_mcp_service.execute_test_suite(request.test_url)
        
        return {
            "success": True,
            "test_url": result.get("test_url"),
            "results": result.get("results", []),
            "test_count": result.get("test_count", 0),
            "passed": result.get("passed", 0),
            "created_at": "2026-01-13T12:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"❌ Test suite failed for {request.test_url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vercel-deploy-test")
async def test_vercel_deployment(request: VercelDeployTestRequest):
    """
    Test Vercel production deployment
    
    Request:
        Production Vercel URL to test
        
    Returns:
        Deployment test results with screenshots
    """
    try:
        logger.info(f"Testing Vercel deployment: {request.vercel_url}")
        
        result = await playwright_mcp_service.deploy_to_vercel_test(request.vercel_url)
        
        return {
            "success": True,
            "url": result.get("url"),
            "screenshot": result.get("screenshot_path"),
            "indicators": result.get("indicators", {}),
            "status": "deployment_tested",
            "created_at": "2026-01-13T12:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"❌ Vercel deployment test failed for {request.vercel_url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================
# SESSION MANAGEMENT ENDPOINTS
# ===========================================

@router.post("/session/save")
async def save_session_state(session_id: str, session_data: Dict):
    """
    Save Playwright session state for recovery
    
    Request:
        Unique session identifier
        Session metadata (URL, cookies, etc.)
        
    Returns:
        Save result
    """
    try:
        logger.info(f"Saving session: {session_id}")
        
        result = await playwright_mcp_service.save_session(session_id, session_data)
        
        return {
            "success": True,
            "session_id": session_id,
            "total_sessions": result.get("total_sessions", 0)
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to save session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/list")
async def list_sessions(limit: int = 100):
    """
    List all Playwright sessions
    
    Request:
        Maximum number of sessions to return (default 100)
        
    Returns:
        List of session metadata
    """
    try:
        from pathlib import Path
        
        # Check if session file exists
        session_file = Path(os.getenv("USER_DATA_DIR", "/app/data/user")) / "playwright_sessions.json"
        
        if not session_file.exists():
            return {
                "success": True,
                "sessions": [],
                "count": 0
            }
        
        import json
        with open(session_file, 'r') as f:
            sessions = json.load(f)
        
        logger.info(f"✅ Found {len(sessions)} sessions")
        
        return {
            "success": True,
            "sessions": sessions,
            "count": len(sessions)
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/cleanup")
async def cleanup_old_sessions(days_old: int = 7):
    """
    Clean up old Playwright sessions
    
    Request:
        Maximum age of sessions to keep (default 7 days)
        
    Returns:
        Cleanup result with count of sessions removed
    """
    try:
        logger.info(f"Cleaning up sessions older than {days_old} days")
        
        result = await playwright_mcp_service.cleanup_sessions(days_old)
        
        return {
            "success": True,
            "cleaned": result.get("cleaned", 0),
            "total_sessions": result.get("total_sessions", 0)
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to cleanup sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================
# HEALTH CHECK ENDPOINTS
# ===========================================

@router.get("/health")
async def health_check():
    """
    Health check endpoint for Playwright automation service
    
    Returns:
        Service health status
    """
    try:
        # Check if browser is initialized
        browser_status = "ok" if playwright_mcp_service.browser else "not_initialized"
        
        return {
            "service": "playwright_automation",
            "status": "healthy" if browser_status == "ok" else "degraded",
            "browser": browser_status,
            "headless": os.getenv("HEADLESS_BROWSER", "false"),
            "screenshot_dir": os.getenv("MEDIA_STORAGE", "/app/data/media") + "/screenshots",
            "sessions_count": len(playwright_mcp_service.browser.pages) if playwright_mcp_service.browser else 0,
            "timestamp": "2026-01-13T12:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {
            "service": "playwright_automation",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2026-01-13T12:00:00Z"
        }

@router.post("/close-browser")
async def close_browser():
    """
    Close Playwright browser and clean up resources
    
    Returns:
        Shutdown status
    """
    try:
        logger.info("Closing Playwright browser...")
        
        await playwright_mcp_service.close()
        
        return {
            "success": True,
            "message": "Playwright browser closed successfully",
            "timestamp": "2026-01-13T12:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to close Playwright browser: {e}")
        raise HTTPException(status_code=500, detail=str(e))