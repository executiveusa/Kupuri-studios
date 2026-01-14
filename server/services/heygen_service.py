"""
HeyGen Service - AI Avatar Video Generation
Generates AI avatar videos from text scripts using HeyGen API
Supports avatar selection, voice customization, and video export
"""

import os
import requests
import asyncio
from typing import Dict, List, Optional
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HeyGenService:
    """Service for generating AI avatar videos using HeyGen API"""
    
    def __init__(self):
        self.api_key = os.getenv("HEYGEN_API_KEY")
        self.api_url = os.getenv("HEYGEN_API_URL", "https://api.heygen.com")
        self.default_avatar_id = os.getenv("HEYGEN_DEFAULT_AVATAR")
        self.default_voice_id = os.getenv("HEYGEN_DEFAULT_VOICE")
        self.model = None
    
    async def generate_avatar_video(
        self,
        script: str,
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None,
        template_id: Optional[str] = None,
        test: bool = False
    ) -> Dict:
        """
        Generate video using AI avatar
        
        Args:
            script: Text script for avatar to speak
            avatar_id: HeyGen avatar ID
            voice_id: Optional voice ID
            template_id: Optional template ID
            test: Whether this is a test generation
            
        Returns:
            Dict with video URL and metadata
        """
        try:
            # Use defaults if not provided
            avatar_id = avatar_id or self.default_avatar_id
            voice_id = voice_id or self.default_voice_id
            
            # Create generation task
            logger.info(f"Creating HeyGen video with avatar: {avatar_id}")
            
            video_input = {
                "text": script,
                "avatar_id": avatar_id,
                "voice_id": voice_id,
                "test": test
            }
            
            # Add template if provided
            if template_id:
                video_input["video_inputs"] = [{
                    "character_id": template_id,
                    "avatar_id": avatar_id
                }]
            
            # Create generation task
            response = requests.post(
                f"{self.api_url}/v1/video.new",
                headers={
                    "X-Api-Key": self.api_key,
                    "Content-Type": "application/json"
                },
                json={"video_input": video_input},
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            video_id = result["data"]["video_id"]
            logger.info(f"Video generation started: {video_id}")
            
            # Wait for completion with polling
            video_url = await self._wait_for_video_completion(video_id)
            
            return {
                "success": True,
                "video_id": video_id,
                "video_url": video_url,
                "duration": len(script.split()) / 3,  # Rough estimate
                "script": script,
                "avatar_id": avatar_id,
                "voice_id": voice_id,
                "status": "completed",
                "created_at": datetime.now().isoformat()
            }
            
        except requests.HTTPError as e:
            logger.error(f"❌ HeyGen HTTP error: {e}")
            raise Exception(f"HeyGen API error: {e}")
        except Exception as e:
            logger.error(f"❌ HeyGen error: {e}")
            raise Exception(f"Failed to generate HeyGen video: {e}")
    
    async def _wait_for_video_completion(self, video_id: str, max_attempts: int = 60) -> str:
        """
        Poll for video completion
        
        Args:
            video_id: Video ID to check
            max_attempts: Maximum polling attempts (5 minutes @ 5s interval)
            
        Returns:
            Video URL when complete
            
        Raises:
            Exception if video generation fails or times out
        """
        attempt = 0
        sleep_interval = 5
        
        logger.info(f"Waiting for video completion: {video_id}")
        
        while attempt < max_attempts:
            try:
                # Check status
                response = requests.get(
                    f"{self.api_url}/v1/video.status",
                    headers={"X-Api-Key": self.api_key},
                    params={"video_id": video_id},
                    timeout=10
                )
                
                response.raise_for_status()
                result = response.json()
                
                status = result["data"]["status"]
                logger.info(f"Video status: {status} (attempt {attempt + 1}/{max_attempts})")
                
                if status == "completed":
                    logger.info("✅ Video generation completed!")
                    return result["data"]["video_url"]
                elif status == "failed":
                    error_msg = result["data"].get("error", "Unknown error")
                    logger.error(f"❌ Video generation failed: {error_msg}")
                    raise Exception(f"Video generation failed: {error_msg}")
                elif status == "processing":
                    progress = result["data"].get("progress", 0)
                    logger.info(f"Video processing: {progress}% complete")
                
            except requests.HTTPError as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
            
            attempt += 1
            if attempt < max_attempts:
                await asyncio.sleep(sleep_interval)
        
        raise Exception(f"Video generation timeout after {max_attempts} attempts")
    
    async def list_avatars(self) -> List[Dict]:
        """
        List available avatars
        
        Returns:
            List of avatar dictionaries with metadata
        """
        try:
            logger.info("Fetching available avatars...")
            
            response = requests.get(
                f"{self.api_url}/v1/avatars.all",
                headers={"X-Api-Key": self.api_key},
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            avatars = result["data"]["avatars"]
            
            logger.info(f"✅ Found {len(avatars)} available avatars")
            
            return avatars
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch avatars: {e}")
            raise Exception(f"Failed to fetch avatars: {e}")
    
    async def get_avatar_details(self, avatar_id: str) -> Dict:
        """
        Get detailed information about a specific avatar
        
        Args:
            avatar_id: Avatar ID to fetch details for
            
        Returns:
            Dictionary with avatar metadata
        """
        try:
            logger.info(f"Fetching avatar details: {avatar_id}")
            
            response = requests.get(
                f"{self.api_url}/v1/avatars/{avatar_id}",
                headers={"X-Api-Key": self.api_key},
                timeout=10
            )
            
            response.raise_for_status()
            result = response.json()
            
            avatar_data = result["data"]["avatar"]
            
            logger.info(f"✅ Fetched avatar details: {avatar_data['avatar_name']}")
            
            return avatar_data
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch avatar details: {e}")
            raise Exception(f"Failed to fetch avatar details: {e}")

# Global service instance
heygen_service = HeyGenService()