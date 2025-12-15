import os
import sys
import io
# Ensure stdout and stderr use utf-8 encoding to prevent emoji logs from crashing python server
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
print('Importing websocket_router')
from routers.websocket_router import *  # DO NOT DELETE THIS LINE, OTHERWISE, WEBSOCKET WILL NOT WORK
print('Importing routers')
from routers import config_router, image_router, root_router, workspace, canvas, ssl_test, chat_router, settings, tool_confirmation, stripe_webhook, agents, litellm_router
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import argparse
from contextlib import asynccontextmanager
from starlette.types import Scope
from starlette.responses import Response
import socketio # type: ignore
print('Importing websocket_state')
from services.websocket_state import sio
print('Importing websocket_service')
from services.websocket_service import broadcast_init_done
print('Importing config_service')
from services.config_service import config_service
print('Importing tool_service')
from services.tool_service import tool_service

async def initialize():
    print('Initializing config_service')
    await config_service.initialize()
    print('Initializing broadcast_init_done')
    await broadcast_init_done()

root_dir = os.path.dirname(__file__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # onstartup
    # TODO: Check if there will be racing conditions when user send chat request but tools and models are not initialized yet.
    await initialize()
    await tool_service.initialize()
    yield
    # onshutdown

print('Creating FastAPI app')
app = FastAPI(lifespan=lifespan)
print('✅ FastAPI app created')

# Configure CORS middleware for HTTP requests
def get_cors_origins_list():
    """Get CORS origins from environment variable, with fallback to development origins."""
    cors_env = os.environ.get('CORS_ORIGINS', '')
    
    if cors_env:
        origins = [origin.strip() for origin in cors_env.split(',') if origin.strip()]
        print(f"🔒 FastAPI CORS origins: {origins}")
        return origins
    
    # Development fallback
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
    print(f"⚠️  CORS_ORIGINS not set, using development origins for FastAPI")
    return dev_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
print('Including routers')
app.include_router(config_router.router)
app.include_router(settings.router)
app.include_router(root_router.router)
app.include_router(canvas.router)
app.include_router(workspace.router)
app.include_router(image_router.router)
app.include_router(ssl_test.router)
app.include_router(chat_router.router)
app.include_router(tool_confirmation.router)
app.include_router(stripe_webhook.router)
app.include_router(agents.router)
app.include_router(litellm_router.router)

# Mount the React build directory
react_build_dir = os.environ.get('UI_DIST_DIR', os.path.join(
    os.path.dirname(root_dir), "react", "dist"))


# 无缓存静态文件类
class NoCacheStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope) -> Response:
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response


static_site = os.path.join(react_build_dir, "assets")
if os.path.exists(static_site):
    app.mount("/assets", NoCacheStaticFiles(directory=static_site), name="assets")


# Simple health endpoint - MUST come before "/" to work
@app.get("/health")
async def health_check():
    """Simple health check that returns immediately - no dependencies."""
    return {"status": "healthy", "port": os.environ.get("PORT", "not set"), "host": os.environ.get("HOST", "not set")}


@app.get("/")
async def serve_react_app():
    try:
        index_path = os.path.join(react_build_dir, "index.html")
        print(f"🔍 Attempting to serve React app from: {index_path}", flush=True)
        print(f"🔍 Path exists: {os.path.exists(index_path)}", flush=True)
        print(f"🔍 React build dir: {react_build_dir}", flush=True)
        print(f"🔍 React build dir exists: {os.path.exists(react_build_dir)}", flush=True)
        if os.path.exists(react_build_dir):
            print(f"🔍 Files in {react_build_dir}: {os.listdir(react_build_dir)}", flush=True)
        
        response = FileResponse(index_path)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    except Exception as e:
        print(f"❌ Error serving React app: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return {"error": str(e), "react_build_dir": react_build_dir}

print('Creating socketio app')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')
print('✅ SocketIO app created successfully')
print('✅ ALL SETUP COMPLETE - APP READY')

if __name__ == "__main__":
    # bypass localhost request for proxy, fix ollama proxy issue
    _bypass = {"127.0.0.1", "localhost", "::1"}
    current = set(os.environ.get("no_proxy", "").split(",")) | set(
        os.environ.get("NO_PROXY", "").split(","))
    os.environ["no_proxy"] = os.environ["NO_PROXY"] = ",".join(
        sorted(_bypass | current - {""}))

    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000,
                        help='Port to run the server on')
    args = parser.parse_args()
    import uvicorn
    
    # Railway provides PORT env var - use it if available
    port = int(os.environ.get("PORT", args.port))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print("=" * 60, flush=True)
    print(f"🚀 KUPURI STUDIOS SERVER STARTING", flush=True)
    print(f"📌 PORT env var: {os.environ.get('PORT', 'NOT SET')}", flush=True)
    print(f"📌 HOST env var: {os.environ.get('HOST', 'NOT SET')}", flush=True)
    print(f"📌 Final port: {port}", flush=True)
    print(f"📌 Final host: {host}", flush=True)
    print(f"📁 UI_DIST_DIR: {os.environ.get('UI_DIST_DIR', 'NOT SET')}", flush=True)
    print(f"📁 React build dir: {react_build_dir}", flush=True)
    print(f"📁 React build exists: {os.path.exists(react_build_dir)}", flush=True)
    if os.path.exists(react_build_dir):
        print(f"📁 React build contents: {os.listdir(react_build_dir)}", flush=True)
    print("=" * 60, flush=True)

    # Use the raw FastAPI app instead of socketio wrapper for debugging
    # TODO: Switch back to socket_app once deployment works
    uvicorn.run(app, host=host, port=port)
