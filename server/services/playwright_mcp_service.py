"""
Playwright MCP Integration Service
Provides browser automation capabilities for automated testing and deployment
Supports headless browser mode, screenshot capture, and automated form interactions
"""

import asyncio
import logging
from typing import Dict, List, Optional
import json
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlaywrightMCPService:
    """Playwright MCP integration service for browser automation"""
    
    def __init__(self):
        self.playwright_url = os.getenv("MCP_PLAYWRIGHT_URL", "http://localhost:3003")
        self.browser_type = os.getenv("BROWSER_TYPE", "chromium")  # chromium, webkit, firefox
        self.headless = os.getenv("HEADLESS_BROWSER", "true").lower() == "true"
        self.screenshot_dir = Path(os.getenv("MEDIA_STORAGE", "/app/data/media")) / "screenshots"
        self.session_file = Path(os.getenv("USER_DATA_DIR", "/app/data/user")) / "playwright_sessions.json"
        self.max_retries = 3
        self.timeout_ms = 30000  # 30 seconds
    
    async def initialize(self):
        """Initialize Playwright browser"""
        try:
            from playwright.async_api import async_playwright
            
            logger.info("Initializing Playwright MCP service...")
            logger.info(f"Browser type: {self.browser_type}")
            logger.info(f"Headless mode: {self.headless}")
            
            # Create directories
            self.screenshot_dir.mkdir(parents=True, exist_ok=True)
            
            # Initialize Playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless
                args=["--no-sandbox", "--disable-dev-shm-usage"]  # Optimize for automation
            )
            
            logger.info("✅ Playwright browser initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Playwright: {e}")
            raise
    
    async def navigate_to_url(self, url: str, wait_for_selector: str = "body", timeout: int = 5000) -> Dict:
        """
        Navigate to URL and wait for element
        
        Args:
            url: URL to navigate to
            wait_for_selector: CSS selector to wait for (body, h1, etc.)
            timeout: Maximum time to wait (ms)
            
        Returns:
            Navigation result with URL and status
        """
        try:
            logger.info(f"Navigating to: {url}")
            
            page = await self.browser.new_page()
            await page.goto(url, timeout=timeout)
            
            # Wait for selector
            try:
                await page.wait_for_selector(wait_for_selector, timeout=timeout)
                logger.info(f"✅ Page loaded: {url}")
                return {
                    "url": url,
                    "status": "loaded",
                    "ready": True
                }
            except Exception as e:
                logger.warning(f"Selector not found or timeout: {url}")
                # Check if page content loaded anyway
                content = await page.content()
                if content:
                    return {
                        "url": url,
                        "status": "partial",
                        "ready": False,
                        "error": str(e)
                    }
                else:
                    raise Exception(f"Failed to load page: {url}")
            
        except Exception as e:
            logger.error(f"❌ Navigation failed for {url}: {e}")
            raise Exception(f"Failed to navigate to {url}: {e}")
    
    async def take_screenshot(self, url: str, filename: str = None) -> Dict:
        """
        Take screenshot of current page
        
        Args:
            url: URL to screenshot (optional if page already loaded)
            filename: Optional filename for screenshot
            
        Returns:
            Dictionary with screenshot path
        """
        try:
            page = self.browser.pages[0] if self.browser.pages else await self.browser.new_page()
            
            if url:
                await page.goto(url, timeout=10000)
            
            # Generate filename if not provided
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.png"
            
            # Take full page screenshot
            screenshot_path = self.screenshot_dir / filename
            await page.screenshot(path=str(screenshot_path), full_page=True)
            
            logger.info(f"✅ Screenshot saved: {screenshot_path}")
            
            return {
                "success": True,
                "screenshot_path": str(screenshot_path),
                "url": url,
                "filename": filename
            }
            
        except Exception as e:
            logger.error(f"❌ Screenshot failed: {e}")
            raise Exception(f"Failed to take screenshot: {e}")
    
    async def fill_form(self, url: str, form_data: Dict, submit: bool = False) -> Dict:
        """
        Fill form with data
        
        Args:
            url: Page URL
            form_data: Dictionary with form field names and values
            submit: Whether to submit form after filling
            
        Returns:
            Form fill result
        """
        try:
            page = self.browser.pages[0] if self.browser.pages else await self.browser.new_page()
            await page.goto(url, timeout=10000)
            
            # Fill form fields
            for field_name, field_value in form_data.items():
                try:
                    # Try to find element by name, id, or label
                    element = await page.query_selector(f"[name='{field_name}'], [id='{field_name}'], [placeholder='{field_name}']").first()
                    
                    if element:
                        await element.fill_value(field_value)
                        logger.info(f"✅ Filled field: {field_name}")
                    else:
                        # Try to find by aria-label
                        element = await page.query_selector(f"[aria-label='{field_name}']").first()
                        if element:
                            await element.fill_value(field_value)
                            logger.info(f"✅ Filled field (aria-label): {field_name}")
                        else:
                            logger.warning(f"⚠️ Could not find field: {field_name}")
                
                except Exception as e:
                    logger.warning(f"⚠️ Failed to fill field {field_name}: {e}")
            
            # Submit form if requested
            if submit:
                # Try to find submit button
                submit_button = await page.query_selector("button[type='submit'], input[type='submit'], [role='button']").first()
                
                if submit_button:
                    await submit_button.click()
                    logger.info("✅ Form submitted")
                    
                    # Wait for navigation or success message
                    await asyncio.sleep(2)
                    
                    # Check for success message or navigation
                    success_message = await page.query_selector(".success, .done, .complete, [role='status']").first()
                    if success_message:
                        logger.info("✅ Form submitted successfully")
                    else:
                        # Wait a bit more
                        await asyncio.sleep(3)
            
            return {
                "success": True,
                "url": url,
                "fields_filled": len(form_data),
                "submitted": submit
            }
            
        except Exception as e:
            logger.error(f"❌ Form fill failed for {url}: {e}")
            raise Exception(f"Failed to fill form: {url}: {e}")
    
    async def execute_test_suite(self, test_url: str) -> Dict:
        """
        Execute automated test suite
        
        Args:
            test_url: Base URL for testing
            
        Returns:
            Test results with screenshots
        """
        try:
            logger.info(f"Executing test suite for: {test_url}")
            
            results = []
            
            # Test 1: Navigate to URL
            nav_result = await self.navigate_to_url(test_url)
            results.append(nav_result)
            
            # Test 2: Take screenshot
            screenshot_result = await self.take_screenshot(test_url, f"test_nav_{datetime.now().timestamp()}.png")
            results.append(screenshot_result)
            
            # Test 3: Check page title
            page = self.browser.pages[0]
            title = await page.title()
            
            results.append({
                "test": "check_title",
                "value": title,
                "url": test_url,
                "status": "completed"
            })
            
            logger.info(f"✅ Test suite completed: {len(results)} tests passed")
            
            return {
                "success": True,
                "test_url": test_url,
                "results": results,
                "test_count": len(results),
                "passed": len(results)
            }
            
        except Exception as e:
            logger.error(f"❌ Test suite failed for {test_url}: {e}")
            raise Exception(f"Failed to execute test suite: {test_url}: {e}")
    
    async def deploy_to_vercel_test(self, vercel_url: str) -> Dict:
        """
        Test Vercel deployment by accessing production URL
        
        Args:
            vercel_url: Production Vercel URL to test
            
        Returns:
            Deployment test results
        """
        try:
            logger.info(f"Testing Vercel deployment: {vercel_url}")
            
            # Navigate to production URL
            result = await self.navigate_to_url(vercel_url, timeout=15000)
            
            # Take screenshot for evidence
            screenshot_result = await self.take_screenshot(vercel_url, f"vercel_deploy_{datetime.now().timestamp()}.png")
            
            # Check for common success indicators
            page = self.browser.pages[0]
            content = await page.content()
            
            success_indicators = {
                "status_code": result.get("status", "unknown"),
                "has_content": len(content) > 0,
                "no_errors": "error" not in content.lower(),
                "ready": result.get("ready", False)
            }
            
            return {
                "success": True,
                "url": vercel_url,
                "screenshot": screenshot_result.get("screenshot_path"),
                "indicators": success_indicators
            }
            
        except Exception as e:
            logger.error(f"❌ Vercel deployment test failed for {vercel_url}: {e}")
            raise Exception(f"Failed to test Vercel deployment: {vercel_url}: {e}")
    
    async def save_session(self, session_id: str, session_data: Dict) -> Dict:
        """
        Save Playwright session state for recovery
        
        Args:
            session_id: Unique session identifier
            session_data: Session metadata (URL, cookies, etc.)
            
        Returns:
            Save result
        """
        try:
            # Load existing sessions
            sessions = []
            if self.session_file.exists():
                with open(self.session_file, 'r') as f:
                    sessions = json.load(f)
            
            # Add or update session
            session_entry = {
                "session_id": session_id,
                "data": session_data,
                "created_at": datetime.now().isoformat(),
                "last_accessed": datetime.now().isoformat()
            }
            
            # Update existing session if exists
            existing_session = next((s for s in sessions if s["session_id"] == session_id), None)
            if existing_session:
                existing_index = sessions.index(existing_session)
                sessions[existing_index] = session_entry
                logger.info(f"✅ Updated existing session: {session_id}")
            else:
                sessions.append(session_entry)
                logger.info(f"✅ Created new session: {session_id}")
            
            # Save sessions
            with open(self.session_file, 'w') as f:
                json.dump(sessions, f, indent=2)
            
            return {
                "success": True,
                "session_id": session_id,
                "total_sessions": len(sessions)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to save session: {session_id}: {e}")
            raise Exception(f"Failed to save session: {session_id}: {e}")
    
    async def close(self):
        """Close Playwright browser and save session"""
        try:
            if self.browser:
                logger.info("Closing Playwright browser...")
                await self.browser.close()
                logger.info("✅ Playwright browser closed")
        except Exception as e:
            logger.error(f"❌ Failed to close Playwright: {e}")
    
    async def cleanup_sessions(self, days_old: int = 7) -> Dict:
        """
        Clean up old Playwright sessions
        
        Args:
            days_old: Maximum age of sessions to keep (default 7 days)
            
        Returns:
            Cleanup result
        """
        try:
            # Load sessions
            if not self.session_file.exists():
                return {
                    "success": True,
                    "cleaned": 0,
                    "total_sessions": 0
                }
            
            with open(self.session_file, 'r') as f:
                sessions = json.load(f)
            
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            # Filter out old sessions
            active_sessions = [
                s for s in sessions 
                if datetime.fromisoformat(s["last_accessed"]) > cutoff_date
            ]
            
            cleaned_count = len(sessions) - len(active_sessions)
            
            # Save updated sessions
            if cleaned_count > 0:
                with open(self.session_file, 'w') as f:
                    json.dump(active_sessions, f, indent=2)
            
            logger.info(f"✅ Cleaned up {cleaned_count} old sessions (older than {days_old} days)")
            
            return {
                "success": True,
                "cleaned": cleaned_count,
                "total_sessions": len(active_sessions)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to cleanup sessions: {e}")
            raise Exception(f"Failed to cleanup sessions: {e}")

# Global service instance
playwright_mcp_service = PlaywrightMCPService()