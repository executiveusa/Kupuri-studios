# services/websocket_state.py
import socketio
import os
from typing import Dict

# Get CORS origins from environment variable, fallback to localhost for development
def get_cors_origins():
    """
    Get allowed CORS origins from environment variable.
    
    Production: Set CORS_ORIGINS="https://kupuri.com,https://www.kupuri.com"
    Development: Defaults to localhost on common ports
    """
    cors_env = os.environ.get('CORS_ORIGINS', '')
    
    if cors_env:
        # Split comma-separated origins and strip whitespace
        origins = [origin.strip() for origin in cors_env.split(',') if origin.strip()]
        print(f"🔒 CORS origins configured from environment: {origins}")
        return origins
    
    # Development fallback - common localhost ports
    dev_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:57988",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:57988"
    ]
    print(f"⚠️  CORS_ORIGINS not set, using development origins: {dev_origins}")
    return dev_origins

sio = socketio.AsyncServer(
    cors_allowed_origins=get_cors_origins(),
    async_mode='asgi'
)

active_connections: Dict[str, dict] = {}

def add_connection(socket_id: str, user_info: dict = None):
    active_connections[socket_id] = user_info or {}
    print(f"New connection added: {socket_id}, total connections: {len(active_connections)}")

def remove_connection(socket_id: str):
    if socket_id in active_connections:
        del active_connections[socket_id]
        print(f"Connection removed: {socket_id}, total connections: {len(active_connections)}")

def get_all_socket_ids():
    return list(active_connections.keys())

def get_connection_count():
    return len(active_connections)
