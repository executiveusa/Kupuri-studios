#!/usr/bin/env python3
"""
Coolify Deployment Automation for Kupuri Studios
Uses Coolify API v1 for automated deployment
"""

import os
import json
import requests
import sys
import time
from typing import Dict, Any, Optional

class CoolifyDeployer:
    def __init__(self, api_url: str, api_token: str):
        """Initialize Coolify deployer"""
        self.api_url = api_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def test_connection(self) -> bool:
        """Test API connection"""
        try:
            print("🔌 Testing Coolify API connection...")
            response = self.session.get(f'{self.api_url}/api/v1/version')
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Connected to Coolify!")
                print(f"   Version: {data.get('version', 'unknown')}")
                return True
            else:
                print(f"❌ Connection failed: HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            return False
    
    def list_servers(self) -> list:
        """List available servers"""
        try:
            print("\n🖥️  Fetching available servers...")
            response = self.session.get(f'{self.api_url}/api/v1/servers')
            
            if response.status_code == 200:
                servers = response.json()
                if servers:
                    print(f"✅ Found {len(servers)} server(s)")
                    for server in servers:
                        print(f"   • {server.get('name')} (UUID: {server.get('uuid')})")
                    return servers
                else:
                    print("⚠️  No servers found. Please add a server in Coolify dashboard first.")
                    return []
            else:
                print(f"❌ Failed to list servers: {response.text}")
                return []
        except Exception as e:
            print(f"❌ Error listing servers: {e}")
            return []
    
    def list_teams(self) -> list:
        """List available teams"""
        try:
            response = self.session.get(f'{self.api_url}/api/v1/teams')
            if response.status_code == 200:
                return response.json()
            return []
        except:
            return []
    
    def create_application(self, server_uuid: str, project_name: str = "kupuri-studios") -> Optional[Dict]:
        """Create application using Coolify API"""
        try:
            print(f"\n📱 Creating application '{project_name}'...")
            
            # Get teams
            teams = self.list_teams()
            if not teams:
                print("❌ No teams found. Cannot create application.")
                return None
            
            team_id = teams[0]['id']
            
            # Create application payload
            payload = {
                "project_uuid": "0",
                "server_uuid": server_uuid,
                "environment_name": "production",
                "destination_uuid": server_uuid,
                "type": "public",
                "name": "kupuri-studios",
                "description": "AI Creative Canvas Platform",
                "is_static": False,
                "domains": "",
                "git_repository": "https://github.com/executiveusa/Kupuri-studios",
                "git_branch": "main",
                "git_source": "github",
                "build_pack": "dockerfile",
                "dockerfile_location": "Dockerfile",
                "base_directory": "/",
                "publish_directory": "",
                "ports_exposes": "8000",
                "ports_mappings": "8000:8000",
                "instant_deploy": False,
            }
            
            response = self.session.post(
                f'{self.api_url}/api/v1/applications',
                json=payload
            )
            
            if response.status_code in [200, 201]:
                app_data = response.json()
                app_uuid = app_data.get('uuid')
                print(f"✅ Application created successfully!")
                print(f"   UUID: {app_uuid}")
                return app_data
            else:
                print(f"❌ Failed to create application")
                print(f"   Status: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating application: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def set_environment_variables(self, app_uuid: str, env_vars: Dict[str, str]):
        """Set environment variables for application"""
        try:
            print("\n🔐 Setting environment variables...")
            
            for key, value in env_vars.items():
                payload = {
                    "key": key,
                    "value": value,
                    "is_build_time": key in ["NODE_ENV", "PYTHONUNBUFFERED"],
                    "is_preview": False,
                    "is_multiline": False
                }
                
                response = self.session.post(
                    f'{self.api_url}/api/v1/applications/{app_uuid}/envs',
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    display_value = value if len(value) < 20 else f"{value[:10]}...{value[-4:]}"
                    print(f"   ✅ {key} = {display_value}")
                else:
                    print(f"   ⚠️  Failed to set {key}: {response.status_code}")
                    
        except Exception as e:
            print(f"❌ Error setting environment variables: {e}")
    
    def deploy(self, app_uuid: str) -> Optional[str]:
        """Trigger deployment"""
        try:
            print("\n🚀 Triggering deployment...")
            
            payload = {
                "force_rebuild": True,
                "instant_deploy": True
            }
            
            response = self.session.post(
                f'{self.api_url}/api/v1/applications/{app_uuid}/deploy',
                json=payload
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                deployment_uuid = result.get('deployment_uuid', 'unknown')
                print(f"✅ Deployment triggered!")
                print(f"   Deployment UUID: {deployment_uuid}")
                return deployment_uuid
            else:
                print(f"❌ Deployment failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error triggering deployment: {e}")
            return None
    
    def set_domain(self, app_uuid: str, domain: str):
        """Set custom domain"""
        try:
            print(f"\n🌐 Setting domain: {domain}")
            
            payload = {
                "domain": domain
            }
            
            response = self.session.patch(
                f'{self.api_url}/api/v1/applications/{app_uuid}',
                json=payload
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Domain configured: {domain}")
                print(f"   SSL will be auto-provisioned by Coolify")
            else:
                print(f"⚠️  Domain setup failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error setting domain: {e}")


def main():
    """Main deployment workflow"""
    print("=" * 70)
    print("🎨 KUPURI STUDIOS - COOLIFY DEPLOYMENT")
    print("=" * 70)
    
    COOLIFY_URL = os.getenv('COOLIFY_URL', '').rstrip('/')
    COOLIFY_TOKEN = os.getenv('COOLIFY_API_TOKEN', '')
    GITHUB_REPO = os.getenv('GITHUB_REPO', 'https://github.com/executiveusa/Kupuri-studios')
    DOMAIN = os.getenv('DOMAIN', '').strip()
    
    if not COOLIFY_URL or not COOLIFY_TOKEN:
        print("\n❌ ERROR: Missing required configuration!")
        print("\nPlease set these environment variables:")
        print("  COOLIFY_URL - Your Coolify instance URL")
        print("  COOLIFY_API_TOKEN - Your Coolify API token")
        sys.exit(1)
    
    print(f"\n📋 Configuration:")
    print(f"   Coolify URL: {COOLIFY_URL}")
    print(f"   Repository: {GITHUB_REPO}")
    if DOMAIN:
        print(f"   Domain: {DOMAIN}")
    
    deployer = CoolifyDeployer(COOLIFY_URL, COOLIFY_TOKEN)
    
    print("\n" + "=" * 70)
    print("STEP 1: Testing Connection")
    print("=" * 70)
    if not deployer.test_connection():
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("STEP 2: Finding Servers")
    print("=" * 70)
    servers = deployer.list_servers()
    if not servers:
        print(f"\n💡 TIP: Add a server in Coolify dashboard: {COOLIFY_URL}/servers")
        sys.exit(1)
    
    server_uuid = servers[0]['uuid']
    print(f"\n✅ Using server: {servers[0].get('name')} ({server_uuid})")
    
    print("\n" + "=" * 70)
    print("STEP 3: Creating Application")
    print("=" * 70)
    app_data = deployer.create_application(server_uuid)
    if not app_data:
        sys.exit(1)
    
    app_uuid = app_data['uuid']
    
    print("\n" + "=" * 70)
    print("STEP 4: Configuring Environment")
    print("=" * 70)
    
    env_vars = {
        'HOST': '0.0.0.0',
        'PORT': '8000',
        'UI_DIST_DIR': '/app/react/dist',
        'NODE_ENV': 'production',
        'PYTHONUNBUFFERED': '1'
    }
    
    for key in ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'REPLICATE_API_TOKEN']:
        value = os.getenv(key)
        if value:
            env_vars[key] = value
    
    deployer.set_environment_variables(app_uuid, env_vars)
    
    if DOMAIN:
        print("\n" + "=" * 70)
        print("STEP 5: Configuring Domain")
        print("=" * 70)
        deployer.set_domain(app_uuid, DOMAIN)
    
    print("\n" + "=" * 70)
    print(f"STEP {'6' if DOMAIN else '5'}: Deploying Application")
    print("=" * 70)
    deployment_uuid = deployer.deploy(app_uuid)
    
    if not deployment_uuid:
        print(f"\n⚠️  Manual deploy needed at: {COOLIFY_URL}")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("✅ DEPLOYMENT INITIATED SUCCESSFULLY!")
    print("=" * 70)
    print(f"\n📊 Summary:")
    print(f"   Application UUID: {app_uuid}")
    print(f"   Deployment UUID: {deployment_uuid}")
    if DOMAIN:
        print(f"   Domain: https://{DOMAIN}")
    
    print(f"\n🔗 Monitor deployment: {COOLIFY_URL}/application/{app_uuid}")
    print("\n✨ Deployment automation complete!\n")


if __name__ == "__main__":
    main()
