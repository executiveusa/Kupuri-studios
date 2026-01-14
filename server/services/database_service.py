"""
Database Service - Supabase Integration
Provides database connection, CRUD operations, and migration management
Supports PostgreSQL via Supabase with automatic connection pooling
"""

import os
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DatabaseConfig:
    """Database configuration loaded from environment"""
    url: str
    anon_key: str
    service_role_key: str
    max_connections: int = 20
    connection_timeout: int = 30

@dataclass
class Project:
    """Project data model"""
    id: str
    name: str
    description: str
    user_id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

@dataclass
class MediaAsset:
    """Media asset data model"""
    id: str
    project_id: str
    name: str
    type: str  # video, audio, image, document
    file_path: str
    file_size_bytes: int
    metadata: Dict
    transcribed: bool = False
    video_generated: bool = False
    created_at: datetime

@dataclass
class Transcript:
    """Transcript data model"""
    id: str
    media_asset_id: str
    text: str
    language: str
    speakers: List[Dict]
    duration_seconds: int
    segments: List[Dict]
    created_at: datetime

class DatabaseService:
    """Service for database operations with Supabase integration"""
    
    def __init__(self):
        self.config = DatabaseConfig(
            url=os.getenv("SUPABASE_URL"),
            anon_key=os.getenv("SUPABASE_ANON_KEY"),
            service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
        self.connection = None
        self.is_connected = False
    
    async def initialize(self):
        """Initialize database connection"""
        try:
            from supabase import create_client, Client
            
            logger.info("Connecting to Supabase...")
            self.connection = create_client(
                self.config.url,
                anon_key=self.config.anon_key,
                options={
                    "connection_timeout": self.config.connection_timeout
                }
            )
            
            # Test connection
            response = self.connection.table("projects").select("*").execute()
            logger.info(f"✅ Database connected successfully! Found {len(response.data)} projects")
            
            self.is_connected = True
            return True
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            self.is_connected = False
            raise Exception(f"Failed to initialize database: {e}")
    
    async def health_check(self) -> Dict:
        """Check database health"""
        try:
            if not self.is_connected:
                return {
                    "service": "database",
                    "status": "disconnected",
                    "message": "Database not initialized"
                }
            
            # Simple health check
            response = self.connection.table("projects").select("count").execute()
            project_count = response.data[0]["count"]
            
            return {
                "service": "database",
                "status": "healthy" if project_count > 0 else "degraded",
                "message": f"{project_count} projects accessible",
                "latency_ms": response.metadata.get("time_taken", 0)
            }
            
        except Exception as e:
            return {
                "service": "database",
                "status": "unhealthy",
                "message": str(e),
                "error": str(e)
            }
    
    async def create_project(
        self,
        name: str,
        description: str,
        user_id: str
        workspace_id: str
    ) -> Project:
        """
        Create a new project
        
        Args:
            name: Project name
            description: Project description
            user_id: User ID who owns the project
            workspace_id: Workspace ID for organization
        
        Returns:
            Created Project object
        """
        try:
            if not self.is_connected:
                raise Exception("Database not connected")
            
            logger.info(f"Creating project: {name}")
            
            # Insert project
            data = {
                "name": name,
                "description": description,
                "user_id": user_id,
                "workspace_id": workspace_id,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            response = self.connection.table("projects").insert(data).execute()
            project_id = response.data[0]["id"]
            
            logger.info(f"✅ Project created with ID: {project_id}")
            
            return Project(
                id=project_id,
                name=name,
                description=description,
                user_id=user_id,
                workspace_id=workspace_id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to create project: {e}")
            raise Exception(f"Failed to create project: {e}")
    
    async def get_project(self, project_id: str) -> Optional[Project]:
        """
        Get project by ID
        
        Args:
            project_id: Project ID
            
        Returns:
            Project object or None
        """
        try:
            if not self.is_connected:
                raise Exception("Database not connected")
            
            response = self.connection.table("projects").select("*").eq("id", project_id).execute()
            
            if not response.data:
                return None
            
            data = response.data[0]
            
            return Project(
                id=data["id"],
                name=data["name"],
                description=data.get("description", ""),
                user_id=data.get("user_id", ""),
                workspace_id=data.get("workspace_id", ""),
                created_at=data.get("created_at"),
                updated_at=data.get("updated_at")
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to get project: {e}")
            raise Exception(f"Failed to get project: {e}")
    
    async def update_project(
        self,
        project_id: str,
        updates: Dict
    ) -> Project:
        """
        Update project with new data
        
        Args:
            project_id: Project ID
            updates: Dictionary of fields to update
            
        Returns:
            Updated Project object
        """
        try:
            if not self.is_connected:
                raise Exception("Database not connected")
            
            updates["updated_at"] = datetime.now().isoformat()
            
            response = self.connection.table("projects").update(updates).eq("id", project_id).execute()
            
            if not response.data:
                raise Exception(f"Project not found: {project_id}")
            
            logger.info(f"✅ Project updated: {project_id}")
            
            return Project(
                id=project_id,
                name=response.data[0]["name"],
                description=response.data[0].get("description", ""),
                user_id=response.data[0].get("user_id", ""),
                workspace_id=response.data[0].get("workspace_id", ""),
                created_at=response.data[0].get("created_at"),
                updated_at=response.data[0]["updated_at"]
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to update project: {e}")
            raise Exception(f"Failed to update project: {e}")
    
    async def delete_project(self, project_id: str) -> bool:
        """
        Delete project by ID
        
        Args:
            project_id: Project ID to delete
            
        Returns:
            Success status
        """
        try:
            if not self.is_connected:
                raise Exception("Database not connected")
            
            logger.info(f"Deleting project: {project_id}")
            
            response = self.connection.table("projects").delete().eq("id", project_id).execute()
            
            if not response.data:
                raise Exception(f"Project not found: {project_id}")
            
            logger.info(f"✅ Project deleted: {project_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete project: {e}")
            raise Exception(f"Failed to delete project: {e}")
    
    async def list_projects(
        self,
        user_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Project]:
        """
        List all projects for a user
        
        Args:
            user_id: User ID
            limit: Maximum number of projects to return
            offset: Number of projects to skip
            
        Returns:
            List of Project objects
        """
        try:
            if not self.is_connected:
                raise Exception("Database not connected")
            
            logger.info(f"Listing projects for user: {user_id}")
            
            # Query projects
            response = self.connection.table("projects").select("*").eq("user_id", user_id).range(limit, offset).order("created_at", desc=True).execute()
            
            projects = []
            for row in response.data:
                projects.append(Project(
                    id=row["id"],
                    name=row["name"],
                    description=row.get("description", ""),
                    user_id=row["user_id"],
                    workspace_id=row.get("workspace_id", ""),
                    created_at=row.get("created_at"),
                    updated_at=row.get("updated_at")
                ))
            
            logger.info(f"✅ Found {len(projects)} projects")
            
            return projects
            
        except Exception as e:
            logger.error(f"❌ Failed to list projects: {e}")
            raise Exception(f"Failed to list projects: {e}")

# Global service instance
database_service = DatabaseService()