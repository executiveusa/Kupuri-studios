# 🏗️ Kupuri Studios - Builder Repository Index

**Purpose:** Complete technical index for the builder agent to understand and work with this codebase.  
**Last Updated:** February 21, 2026  
**Status:** Ready for Architect Instructions

---

## 📋 Project Overview

**Kupuri Studios** is an open-source multimodal canvas creative agent - a fork of [Jaaz.app](https://github.com/11cafe/jaaz) with enhanced deployment and bilingual support (English/Spanish).

### Core Features
- 🎬 One-Prompt Image & Video Generation
- 🧙 Magic Canvas & Magic Video (prompt-free creation)
- 🖼️ Infinite Canvas & Visual Storyboarding
- 🤖 Smart AI Agent System
- ⚙️ Flexible Deployment (Electron desktop, Docker, VPS)
- 🔐 Privacy & Security (local-first)

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    KUPURI STUDIOS ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │   ELECTRON APP   │     │   DOCKER DEPLOY  │                  │
│  │  (Desktop App)   │     │   (VPS/Cloud)    │                  │
│  └────────┬─────────┘     └────────┬─────────┘                  │
│           │                        │                             │
│           └──────────┬─────────────┘                             │
│                      ▼                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   REACT FRONTEND                          │  │
│  │  Vite + TypeScript + Tailwind CSS 4 + Framer Motion       │  │
│  │  TanStack Router + Query + i18n + Zustand                 │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│                              │ HTTP/WebSocket                    │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  PYTHON BACKEND                           │  │
│  │  FastAPI + Socket.IO + LangGraph + LiteLLM                │  │
│  │  Multiple AI Providers (OpenAI, Anthropic, Google, etc.)  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

### Root Level
```
Kupuri-studios/
├── electron/              # Electron desktop app main process
├── react/                 # React frontend (Vite + TypeScript)
├── server/                # Python FastAPI backend
├── jaaz-main/             # Original jaaz source (reference)
├── assets/                # Static assets (icons, images)
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
├── tests/                 # Test files
├── .github/               # GitHub workflows
├── .vscode/               # VSCode settings
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Docker Compose config
├── package.json           # Root package.json (Electron)
├── pyproject.toml         # Python project config
└── *.md                   # Various documentation files
```

---

## 🖥️ Frontend Architecture (react/)

### Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI framework |
| TypeScript | 5.7.2 | Type safety |
| Vite | 6.2.0 | Build tool |
| Tailwind CSS | 4.0.17 | Styling |
| Framer Motion | 12.23.24 | Animations |
| TanStack Router | 1.120.15 | Routing |
| TanStack Query | 5.80.3 | Data fetching |
| Zustand | 5.0.5 | State management |
| i18next | 25.2.1 | Internationalization |
| Socket.io-client | 4.8.1 | Real-time communication |
| Excalidraw | 0.18.0 | Canvas drawing |
| tldraw | 3.13.1 | Alternative canvas |

### Key Directories
```
react/src/
├── api/                   # API client modules
│   ├── agent.ts           # Agent API
│   ├── auth.ts            # Authentication
│   ├── billing.ts         # Stripe billing
│   ├── canvas.ts          # Canvas operations
│   ├── chat.ts            # Chat API
│   ├── config.ts          # Configuration
│   ├── knowledge.ts       # Knowledge base
│   ├── magic.ts           # Magic features
│   ├── model.ts           # Model management
│   ├── settings.ts        # Settings API
│   └── upload.ts          # File upload
│
├── components/            # React components
│   ├── agent_studio/      # Agent node editor
│   ├── auth/              # Authentication components
│   ├── billing/           # Billing components
│   ├── canvas/            # Canvas components
│   ├── chat/              # Chat interface
│   ├── comfyui/           # ComfyUI integration
│   ├── common/            # Shared components
│   ├── error/             # Error pages
│   ├── home/              # Home/dashboard
│   ├── knowledge/         # Knowledge editor
│   ├── landing/           # Landing page
│   ├── material/          # Material manager
│   ├── settings/          # Settings dialogs
│   ├── theme/             # Theme provider
│   └── ui/                # UI primitives (shadcn)
│
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   ├── canvas.tsx         # Canvas state
│   ├── configs.tsx        # App configuration
│   ├── socket.tsx         # WebSocket connection
│   └── theme.tsx          # Theme state
│
├── hooks/                 # Custom React hooks
│   ├── use-balance.ts     # Credit balance
│   ├── use-debounce.ts    # Debounce utility
│   ├── use-ghost-elements.ts # Canvas ghosts
│   ├── use-is-mobile.ts   # Mobile detection
│   ├── use-language.ts    # Language switching
│   ├── use-mobile.ts      # Mobile hook
│   ├── use-notifications.ts # Notifications
│   └── use-theme.ts       # Theme switching
│
├── i18n/                  # Internationalization
│   ├── index.ts           # i18n configuration
│   └── locales/
│       ├── en/            # English translations
│       └── es-MX/         # Spanish translations
│
├── lib/                   # Utility libraries
│   ├── event.ts           # Event emitter
│   ├── notifications.ts   # Notification system
│   ├── socket.ts          # Socket.io setup
│   ├── stripe.ts          # Stripe integration
│   ├── usageTracker.ts    # Usage tracking
│   └── utils.ts           # General utilities
│
├── providers/             # Context providers
│   └── ThemeProvider.tsx  # Theme provider
│
├── routes/                # TanStack Router routes
│   ├── __root.tsx         # Root layout
│   ├── agent_studio.tsx   # Agent studio route
│   ├── assets.tsx         # Assets route
│   ├── canvas.$id.tsx     # Canvas route (dynamic)
│   └── dashboard.tsx      # Dashboard route
│
├── stores/                # Zustand stores
├── types/                 # TypeScript types
├── utils/                 # Utility functions
│
├── App.tsx                # Main app component
├── main.tsx               # Entry point
├── route-tree.gen.ts      # Generated route tree
└── constants.ts           # App constants
```

### Important Components

#### Canvas System
- [`CanvasExcali.tsx`](react/src/components/canvas/CanvasExcali.tsx) - Main canvas component using Excalidraw
- [`VideoElement.tsx`](react/src/components/canvas/VideoElement.tsx) - Video element handling
- [`CanvasHeader.tsx`](react/src/components/canvas/CanvasHeader.tsx) - Canvas toolbar
- [`CanvasExport.tsx`](react/src/components/canvas/CanvasExport.tsx) - Export functionality

#### Chat System
- [`Chat.tsx`](react/src/components/chat/Chat.tsx) - Main chat interface
- [`ChatTextarea.tsx`](react/src/components/chat/ChatTextarea.tsx) - Chat input with magic features
- [`ModelSelectorV3.tsx`](react/src/components/chat/ModelSelectorV3.tsx) - AI model selection
- [`Markdown.tsx`](react/src/components/chat/Markdown.tsx) - Markdown rendering

#### Landing Page
- [`LandingPage.tsx`](react/src/components/landing/proper-prompts/LandingPage.tsx) - Main landing page
- [`LandingHero.tsx`](react/src/components/landing/proper-prompts/LandingHero.tsx) - Hero section
- [`InteractiveDemo.tsx`](react/src/components/landing/proper-prompts/InteractiveDemo.tsx) - Demo component

---

## 🔧 Backend Architecture (server/)

### Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12+ | Runtime |
| FastAPI | 0.115.0 | Web framework |
| Uvicorn | 0.30.6 | ASGI server |
| LangGraph | 0.3.29 | AI agent orchestration |
| LiteLLM | 1.61.0 | Unified LLM interface |
| Socket.IO | 5.13.0 | Real-time communication |
| SQLite (aiosqlite) | - | Database |
| Stripe | - | Payments |

### Key Directories
```
server/
├── main.py                # FastAPI app entry point
├── common.py              # Shared utilities
├── requirements.txt       # Python dependencies
│
├── models/                # Data models
│   ├── config_model.py    # Configuration models
│   ├── db_model.py        # Database models
│   └── tool_model.py      # Tool models
│
├── routers/               # API routes
│   ├── agents.py          # Agent endpoints
│   ├── canvas.py          # Canvas CRUD
│   ├── chat_router.py     # Chat endpoints
│   ├── comfyui_execution.py # ComfyUI execution
│   ├── config_router.py   # Configuration
│   ├── image_router.py    # Image generation
│   ├── litellm_router.py  # LiteLLM proxy
│   ├── metrics_router.py  # Prometheus metrics
│   ├── root_router.py     # Root endpoints
│   ├── settings.py        # Settings API
│   ├── stripe_webhook.py  # Stripe webhooks
│   ├── tool_confirmation.py # Tool confirmations
│   ├── websocket_router.py # WebSocket handlers
│   └── workspace.py       # Workspace management
│
├── services/              # Business logic
│   ├── chat_service.py    # Chat processing
│   ├── config_service.py  # Configuration service
│   ├── db_service.py      # Database operations
│   ├── jaaz_service.py    # Jaaz API integration
│   ├── knowledge_service.py # Knowledge base
│   ├── magic_service.py   # Magic features
│   ├── mcp.py             # Model Context Protocol
│   ├── metrics_service.py # Metrics collection
│   ├── settings_service.py # Settings management
│   ├── stream_service.py  # Streaming responses
│   ├── tool_confirmation_manager.py
│   ├── tool_service.py    # Tool execution
│   ├── websocket_service.py # WebSocket logic
│   ├── websocket_state.py # WebSocket state
│   │
│   ├── langgraph_service/ # LangGraph AI agents
│   │   ├── agent_manager.py
│   │   ├── agent_service.py
│   │   ├── StreamProcessor.py
│   │   └── configs/       # Agent configurations
│   │
│   ├── migrations/        # Database migrations
│   │   ├── manager.py
│   │   ├── v1_initial_schema.py
│   │   ├── v2_add_canvases.py
│   │   └── v3_add_comfy_workflow.py
│   │
│   └── OpenAIAgents_service/ # OpenAI agents
│       └── jaaz_magic_agent.py
│
├── tools/                 # AI tools
│   ├── comfy_dynamic.py   # ComfyUI integration
│   ├── write_plan.py      # Planning tool
│   ├── video_generation_utils.py
│   │
│   ├── image_providers/   # Image generation providers
│   │   ├── comfyui_provider.py
│   │   ├── image_base_provider.py
│   │   ├── jaaz_provider.py
│   │   ├── openai_provider.py
│   │   ├── replicate_provider.py
│   │   ├── volces_provider.py
│   │   └── wavespeed_provider.py
│   │
│   ├── video_providers/   # Video generation providers
│   │   ├── video_base_provider.py
│   │   └── volces_provider.py
│   │
│   ├── video_generation/  # Video generation
│   │   ├── video_generation_core.py
│   │   └── video_canvas_utils.py
│   │
│   └── utils/             # Tool utilities
│       ├── comfyui.py
│       ├── image_canvas_utils.py
│       ├── image_generation_core.py
│       └── image_utils.py
│
├── utils/                 # General utilities
│   ├── canvas.py
│   ├── http_client.py
│   └── url_helper.py
│
└── asset/                 # Default assets
    └── default_comfy_t2i_workflow.json
```

### API Endpoints Overview

| Router | Base Path | Purpose |
|--------|-----------|---------|
| `root_router` | `/` | Health check, static files |
| `config_router` | `/config` | App configuration |
| `chat_router` | `/chat` | Chat operations |
| `canvas` | `/canvas` | Canvas CRUD |
| `agents` | `/agents` | Agent management |
| `image_router` | `/image` | Image generation |
| `settings` | `/settings` | User settings |
| `workspace` | `/workspace` | Workspace operations |
| `litellm_router` | `/litellm` | LiteLLM proxy |
| `metrics_router` | `/metrics` | Prometheus metrics |
| `stripe_webhook` | `/webhook/stripe` | Stripe webhooks |
| `websocket_router` | `/socket.io` | WebSocket |

---

## ⚡ Electron App (electron/)

### Main Files
```
electron/
├── main.js                # Main process (window management, Python server)
├── preload.js             # Preload script (IPC bridge)
├── ipcHandlers.js         # IPC handlers
├── settingsService.js     # Settings management
├── comfyUIInstaller.js    # ComfyUI installation
├── comfyUIManager.js      # ComfyUI process management
├── gemin_service.ts       # Google Gemini service
└── tsconfig.json          # TypeScript config
```

### Key Features
- Spawns Python FastAPI server on startup
- Auto-updates via electron-updater
- ComfyUI installation and management
- Proxy settings support
- Single instance lock

### IPC Channels
| Channel | Purpose |
|---------|---------|
| `pick-image` | Open image file picker |
| `pick-video` | Open video file picker |
| `check-for-updates` | Check for app updates |
| `restart-and-install` | Install update |
| ComfyUI channels | Install, start, stop, uninstall |

---

## 🐳 Docker Deployment

### Dockerfile (Multi-stage)
```dockerfile
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-build
# Builds react/dist

# Stage 2: Python Backend  
FROM python:3.12-slim
# Copies server/ and react/dist
# Exposes port 8000
```

### Docker Compose
- [`docker-compose.yml`](docker-compose.yml) - Development compose
- [`docker-compose.prod.yml`](docker-compose.prod.yml) - Production compose

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `UI_DIST_DIR` | `/app/react/dist` | Frontend build path |
| `CORS_ORIGINS` | - | Allowed CORS origins |
| `BASE_API_URL` | `https://jaaz.app` | Jaaz API URL |

---

## 🎨 Design System

### Color Palette
```css
/* Background */
--bg-primary: #020617 (slate-950)
--bg-card: #0f172a (slate-900)

/* Text */
--text-primary: #f8fafc (slate-50)
--text-secondary: #94a3b8 (slate-400)

/* Accent Gradient */
gradient: linear-gradient(to right, #818cf8, #c084fc, #f9a8d4)
```

### Key CSS Utilities
```css
.text-gradient    /* Gradient text effect */
.bg-glow          /* Radial glow background */
.bg-glow-purple   /* Purple glow variant */
.bg-glow-blue     /* Blue glow variant */
```

### Animation Patterns
- Framer Motion for all animations
- Staggered fade-in for page loads
- Floating orbs for hero sections
- Glassmorphism for inputs/cards

---

## 🔌 AI Provider Integration

### Supported Providers
| Provider | Type | Tools |
|----------|------|-------|
| OpenAI | Chat + Image | GPT-4o, DALL-E |
| Anthropic | Chat | Claude |
| Google | Chat + Image | Gemini, Imagen |
| Replicate | Image | Flux, Ideogram |
| Volces | Image + Video | Doubao, Seedance |
| Jaaz API | Image + Video | Multiple models |
| ComfyUI | Image | Local generation |
| Midjourney | Image | Via Jaaz API |
| Kling | Video | Via Jaaz API |
| VEO3 | Video | Via Jaaz API |

### Tool System
- [`tool_service.py`](server/services/tool_service.py) - Tool orchestration
- [`image_base_provider.py`](server/tools/image_providers/image_base_provider.py) - Base image provider
- [`video_base_provider.py`](server/tools/video_providers/video_base_provider.py) - Base video provider

---

## 📊 State Management

### Frontend State
| Store | Purpose | Location |
|-------|---------|----------|
| Zustand | Global state | `react/src/stores/` |
| React Query | Server state | TanStack Query |
| Context | Auth, Theme, Canvas | `react/src/contexts/` |

### Backend State
| Service | Purpose |
|---------|---------|
| SQLite | Persistent storage |
| Socket.IO | Real-time state sync |
| LangGraph | Agent state management |

---

## 🧪 Testing

### Frontend Tests
- Vitest for unit tests
- Playwright for E2E tests
- Configuration: [`vitest.config.js`](vitest.config.js), [`playwright.config.ts`](playwright.config.ts)

### Backend Tests
- Located in [`electron/test/`](electron/test/)
- ComfyUI installer tests

---

## 📝 Development Commands

### Frontend
```bash
cd react
npm install --legacy-peer-deps
npm run dev          # Development server (port 5174)
npm run build        # Production build
npm run lint         # ESLint
```

### Backend
```bash
cd server
pip install -r requirements.txt
python main.py       # Start server (port 8000)
```

### Electron
```bash
npm install
npm run dev          # Development mode
npm run start        # Production mode
npm run build:mac    # Build for macOS
npm run build:win    # Build for Windows
npm run build:linux  # Build for Linux
```

### Docker
```bash
docker build -t kupuri-studios:latest .
docker run -d -p 8000:8000 kupuri-studios:latest
docker-compose up -d
```

---

## 🔐 Security Considerations

1. **Local-first**: Data stays on device by default
2. **API Keys**: Stored in localStorage (frontend) or environment variables (backend)
3. **CORS**: Configurable via `CORS_ORIGINS` environment variable
4. **Authentication**: Optional, via Jaaz API or Stripe
5. **No tracking**: Open-source, privacy-focused

---

## 📚 Key Documentation Files

| Document | Purpose |
|----------|---------|
| [`README.md`](README.md) | Project overview |
| [`DESIGN-GUIDE.md`](DESIGN-GUIDE.md) | Visual design specifications |
| [`DOC-INDEX.md`](DOC-INDEX.md) | Documentation index |
| [`DOCKER-DEPLOY.md`](DOCKER-DEPLOY.md) | Docker deployment guide |
| [`REFACTOR-SUMMARY.md`](REFACTOR-SUMMARY.md) | Refactor overview |

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 8000 in use | Kill existing process or change `PORT` env var |
| Python version error | Ensure Python 3.12+ is installed |
| npm install fails | Use `--legacy-peer-deps` flag |
| WebSocket disconnects | Check CORS settings, ensure Socket.IO is running |
| Canvas not loading | Check Excalidraw/tldraw dependencies |
| AI generation fails | Verify API keys are configured |

---

## 🎯 Builder Readiness Checklist

- [x] Repository structure understood
- [x] Frontend architecture documented
- [x] Backend architecture documented
- [x] Electron app structure documented
- [x] Docker deployment documented
- [x] Design system documented
- [x] AI provider integration documented
- [x] Development commands documented
- [ ] **AWAITING ARCHITECT INSTRUCTIONS**

---

**Builder Status:** 🟢 READY  
**Next Action:** Wait for architect's mission instructions
