# KUPURI STUDIOS ECOSYSTEM BLUEPRINT
## The Complete Vision for Multi-App Creative Operating System

**Status**: Architecture Design Phase | **Date**: January 14, 2026  
**Vision**: Create an integrated suite of creative AI tools (like Microsoft Office, Apple Suite, Google Workspace) where each "bubble" app connects to a shared backend ecosystem.

---

## 🎯 CORE VISION

Kupuri Studios is **NOT a monolithic application** - it's an **operating system for creative content creators**.

### Ecosystem Structure
```
KUPURI STUDIOS OS (The Umbrella)
│
├─ JAAZ Bubble (Video Creation)
│  ├─ AI video generation
│  ├─ Script writing
│  ├─ Asset management
│  └─ Integration: Via /api/jaaz routes
│
├─ POSTIZ Bubble (Social Automation)
│  ├─ Multi-platform posting
│  ├─ Schedule management
│  ├─ Analytics tracking
│  └─ Integration: Via /api/postiz routes
│
├─ [Designer Bubble] (Future)
│  ├─ Graphic design
│  ├─ Template system
│  └─ Integration: Via /api/designer routes
│
├─ [Analytics Bubble] (Future)
│  ├─ Performance metrics
│  ├─ Reporting
│  └─ Integration: Via /api/analytics routes
│
└─ SHARED ECOSYSTEM BACKBONE
   ├─ Authentication (Session management)
   ├─ LiteLLM Router (Smart model switching)
   ├─ Database Layer (PostgreSQL)
   ├─ Payment System (Stripe)
   ├─ Webhook Orchestrator
   ├─ Agent Supervisor (Task routing)
   ├─ Storage (Cloud/Local)
   └─ WebSocket Layer (Real-time updates)
```

---

## 📦 CURRENT COMPONENT STATUS

### ✅ FULLY INTEGRATED COMPONENTS

#### **1. JAAZ (Video Creation App)**
```
Location: server/services/jaaz_service.py (500+ lines)
Routes: server/routers/video_generation_router.py, video_script_router.py
Frontend: react/src/pages (Video studio pages)
Status: PRODUCTION READY

Capabilities:
- Cloud-based video generation
- Magic image generation
- Task polling & tracking
- Multiple model support (Sunra, HeyGen, etc)
- Async task execution with callbacks
- Asset library management

Integration Pattern:
  User → React UI → /api/video/generate → JAAZ Service → Cloud API → callback → UI update
```

#### **2. LITELLM ROUTER (Model Switching Engine)**
```
Location: server/services/litellm_router_service.py (400+ lines)
         server/routers/litellm_router.py (200+ lines)
Config: litellm_config.yaml
Status: PRODUCTION READY

Capabilities:
- Smart LLM routing by task type (UI, reasoning, creative, code, etc)
- Free-tier model detection (Gemini 2.0 Flash, DeepSeek, Llama)
- Premium model routing (Claude, GPT-4o, Grok)
- Token cost tracking & optimization
- Health checks & fallback routing
- Vision-capable model detection
- Usage statistics & spend tracking

Task-Based Routing:
  - UI-Generation → Fast model (DeepSeek, Gemini)
  - Code Tasks → Code-optimized (Claude, GPT-4)
  - Creative → Reasoning model (Claude Sonnet, Grok)
  - Summarization → Efficient model
  - Translation → Multi-lingual model
  - Function Calling → Structured output model
  - Image Generation → Vision model + image generation API
  - Video Script → Long-context reasoning model
  - Transcription → Audio specialist model

Integration Pattern:
  Any Service → LiteLLM Router → Select Best Model → Execute → Cost Track → Return Result
```

#### **3. MOTION PRIMITIVES (Component Library)**
```
Location: react/package.json (dependency: "motion": "^12.16.0")
Status: ACTIVE - Used throughout UI

Capabilities:
- Framer Motion animations
- Smooth component transitions
- Interactive UI elements
- Performance optimized

Usage Pattern:
  All React Components → Import Motion → Create animated UIs
  Used in: Canvas editor, Dashboard, Panels, Overlays
```

#### **4. AGENT SUPERVISOR (Task Orchestration)**
```
Location: server/services/agent_registry.py
         server/routers/supervisor_router.py
         server/routers/agents.py
Status: PRODUCTION READY

Agents Currently Defined:
1. Supervisor Agent (Task routing)
   - Routes to specialist agents
   - Decomposes complex tasks
   - Manages task sequences

2. Lead Qualifier Agent (BANT scoring)
   - Budget analysis
   - Authority detection
   - Need identification
   - Timeline assessment

3. Content Creator Agent (Multi-platform)
   - Landing page generation
   - Social media content
   - Email sequences
   - Ad copy creation

4. Customer Support Agent (Ticket handling)
   - Response generation
   - Sentiment analysis
   - FAQ answering
   - Escalation logic

5. Analyst Agent (Data analysis)
   - Report generation
   - Metrics analysis
   - Trend identification

Integration Pattern:
  Task → Supervisor → Route to Agent → Execute Capability → Respond
```

#### **5. AUTHENTICATION SYSTEM**
```
Location: server/services/config_service.py, auth middleware
Status: PRODUCTION READY

Features:
- Session management
- Token-based auth
- Config-based permissions
- API key management

Planned: NextAuth for unified web/desktop auth
```

#### **6. MONITORING & METRICS**
```
Location: server/services/metrics_service.py
         React Dashboard component
Status: PRODUCTION READY

Features:
- Request logging
- Error tracking
- Performance metrics
- Cost/token tracking (from LiteLLM)
- Dashboard visualization

Reference: Kupuri Studios 2.1 Version has Prometheus + Dashboard
```

---

## 🔧 BUBBLE APP ARCHITECTURE

### Template: How Each Bubble Should Be Structured

```
Bubble: [AppName]
├── Frontend
│  ├── React App (Vite)
│  ├── Components specific to this app
│  ├── Routes (e.g., /editor, /library, /settings)
│  └── Integration: Call shared backend APIs
│
├── Backend Services (Optional)
│  ├── App-specific service (e.g., jaaz_service.py)
│  ├── Business logic
│  └── Integration: Use LiteLLM Router for AI tasks
│
├── API Routes
│  ├── /api/[app]/action1
│  ├── /api/[app]/action2
│  └── All routes: Require auth, support webhooks
│
└── Integration Points
   ├── Shared Authentication
   ├─ Shared Database (PostgreSQL)
   ├── Shared Payment (Stripe)
   ├── Shared LiteLLM Router
   ├── Shared Agent Supervisor
   └── Shared Webhooks/Events

Connection Method:
   Within same ecosystem? → Direct backend calls (server-to-server)
   Different machine? → REST API calls + Webhooks
   Real-time needed? → WebSocket connections
```

### JAAZ Bubble (Reference Implementation)
```
JAAZ (Video Creation)
├── Frontend: react/src/pages/VideoStudio
│   ├── Editor component
│   ├── Asset library browser
│   ├── Script generator UI
│   └── Preview window
│
├── Backend: server/services/jaaz_service.py
│   ├── Video generation (cloud API calls)
│   ├── Magic image generation
│   ├── Task polling
│   └── Callback handling
│
├── Routes: server/routers/
│   ├── video_generation_router.py (/api/video/generate, /api/video/status)
│   ├── video_script_router.py (/api/script/generate)
│   └── image_router.py (/api/image/generate)
│
└── Integrations:
    ├── LiteLLM Router → For script generation
    ├── Shared Database → Save projects/assets
    ├── Webhooks → Notify when video ready
    ├── Stripe → Track token usage
    └── Auth → User-scoped projects
```

---

## 🏗️ RECOMMENDED MONOREPO STRUCTURE (Phase-Based Migration)

### PHASE 1: Current Structure (AS-IS)
```
KUPURI MEDIA CDMX/
├── .git/
├── docs/
│   ├── agents.md (Agent Capability Matrix)
│   ├── universal-ai-video-upgrade-plan.md (7-phase roadmap)
│   ├── founder-agent.md (Synthia persona)
│   ├── TECHNICAL-ARCHITECTURE.md
│   └── CLEANUP-COMPLETION-REPORT.md
├── react/                              # Current frontend
│   ├── src/
│   │   ├── pages/ (JAAZ, Settings, Dashboard)
│   │   ├── components/ (Reusable UI)
│   │   ├── stores/ (Zustand state)
│   │   ├── api/ (Client code)
│   │   └── styles/ (Motion Primitives)
│   └── package.json (includes @jaaz/agent-ui, motion)
├── server/                             # Current backend
│   ├── routers/ (24 routes)
│   ├── services/ (27 services including JAAZ, LiteLLM)
│   ├── models/
│   ├── workflows/
│   ├── tools/
│   ├── database/
│   └── main.py (FastAPI)
└── KUPURI MEDIA MASTER FILES/          # Reference materials
    ├── KUPURI STUDIOS 2.1 VERSION/ (Production reference)
    ├── yappyverse-comics (1)/ (Reference)
    ├── anthropic-skills/ (API reference)
    └── [other references]
```

### PHASE 2: Proposed Monorepo (Post-Migration)
```
kupuri-studios-monorepo/
│
├── apps/
│   ├── web/                            # Migrated from react/
│   │   ├── src/
│   │   │   ├── bubbles/
│   │   │   │   ├── jaaz/               # Video bubble pages
│   │   │   │   ├── postiz/             # Social bubble pages
│   │   │   │   ├── dashboard/          # Central dashboard
│   │   │   │   └── settings/
│   │   │   ├── components/             # Shared components
│   │   │   └── pages/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── server/                         # Migrated from server/
│   │   ├── ecosystem_core/
│   │   │   ├── auth/
│   │   │   ├── payments/
│   │   │   ├── webhooks/
│   │   │   └── events/
│   │   │
│   │   └── bubbles/
│   │       ├── jaaz/
│   │       │   ├── routers/
│   │       │   ├── services/
│   │       │   └── models/
│   │       ├── postiz/
│   │       │   ├── routers/
│   │       │   ├── services/
│   │       │   └── models/
│   │       └── [other bubbles]/
│   │
│   └── electron/                       # Desktop wrapper (if needed)
│
├── packages/
│   ├── motion-primitives/              # Shared UI component library
│   │   ├── src/
│   │   │   ├── buttons/
│   │   │   ├── layouts/
│   │   │   ├── animations/
│   │   │   └── theme/
│   │   └── package.json
│   │
│   ├── litellm-router/                 # Smart model selection engine
│   │   ├── src/
│   │   │   ├── routing_logic/
│   │   │   ├── cost_tracking/
│   │   │   ├── health_checks/
│   │   │   └── config/
│   │   ├── python/
│   │   │   └── (Move litellm_router_service.py here)
│   │   └── package.json
│   │
│   ├── ecosystem-types/                # Shared type definitions & contracts
│   │   ├── src/
│   │   │   ├── bubble.ts
│   │   │   ├── video.ts
│   │   │   ├── social.ts
│   │   │   ├── agent.ts
│   │   │   └── payment.ts
│   │   └── package.json
│   │
│   ├── database/                       # Shared database schema
│   │   ├── prisma/
│   │   │   └── schema.prisma           # Unified schema for all bubbles
│   │   └── migrations/
│   │
│   └── config/                         # Shared configs
│       ├── eslint/
│       ├── prettier/
│       ├── tsconfig/
│       └── environment/
│
├── services/                           # Specialized microservices
│   ├── litellm-proxy/                  # LiteLLM routing service
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── main.py
│   │
│   ├── asr-service/                    # WhisperX (planned)
│   ├── scene-detection/                # Scene detection (planned)
│   ├── vision-planner/                 # Vision-language planning (planned)
│   └── compile-service/                # FFmpeg compilation (planned)
│
├── docs/
│   ├── architecture/
│   │   ├── ecosystem-overview.md       # This blueprint
│   │   ├── bubble-integration.md
│   │   ├── api-contracts.md
│   │   └── data-flow.md
│   │
│   ├── guides/
│   │   ├── adding-new-bubble.md
│   │   ├── litellm-routing.md
│   │   ├── deployment.md
│   │   └── operations.md
│   │
│   └── reference/
│       ├── agents.md
│       ├── founder-agent.md
│       └── technical-architecture.md
│
├── docker-compose.yml                  # Local development (all services)
├── turbo.json                          # Turborepo build orchestration
├── pnpm-workspace.yaml                 # PNPM monorepo config
├── tsconfig.json                       # Root TypeScript config
├── .gitignore
├── README.md                           # Ecosystem overview
└── package.json                        # Root workspace definition
```

---

## 🔗 ECOSYSTEM INTEGRATION PATTERNS

### Pattern 1: Direct Backend-to-Backend (Recommended for Ecosystem)
```
When: Services in same deployment, low latency needed, tight coupling acceptable

Bubble A Service → Ecosystem Core Service → Bubble B Service

Example:
JAAZ Service calls LiteLLM Router directly (Python import)
  ↓
litellm_router_service.get_best_model(task_type="video_script")
  ↓
Get result, use it for script generation

Code Example:
from server.services.litellm_router_service import LiteLLMRouter

router = LiteLLMRouter()
best_model = router.get_best_model(
    task_type="creative",
    budget="premium",
    requirements={"vision": True}
)
script = generate_script_with_model(best_model)
```

### Pattern 2: REST API Over WebSocket (For External Bubbles)
```
When: Services in different deployments, independent scaling, public API

Bubble A (Port 8001) ← REST API ← Bubble B (Port 8002)

Example:
POSTIZ Social Bubble calls Shared Backend for auth
  ↓
POST /api/ecosystem/auth/validate
  ↓
Response: { valid: true, user_id, permissions, quota }

Code Example:
// From POSTIZ app (could be different server/machine)
const authResponse = await fetch('https://ecosystem.kupuri.studio/api/auth/validate', {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: JSON.stringify({ token })
});
const { valid, quota } = await authResponse.json();
```

### Pattern 3: Webhook-Based Events (For Async Communication)
```
When: One-directional notifications, decoupled processes

Bubble A generates event → Ecosystem Webhook Hub → Broadcasts to Bubble B

Example:
JAAZ finishes video generation
  ↓
POST /ecosystem/webhooks/video.complete
  ↓
Hub checks subscriptions
  ↓
POST https://postiz.api/webhooks/video-ready (registered callback)
  ↓
POSTIZ auto-schedules the video for social posting

Event Types:
- video.generated
- content.created
- payment.processed
- storage.ready
- analysis.complete
```

### Pattern 4: Shared Agent Supervisor (For Complex Multi-Bubble Tasks)
```
When: Task needs coordination across multiple bubbles

User Request → Supervisor Agent → Task Planning
  ↓
Split into sub-tasks:
  - Task A → JAAZ (generate video)
  - Task B → POSTIZ (prepare social posting)
  - Task C → Designer (create thumbnail)
  ↓
Execute in parallel/sequence
  ↓
Aggregate results
  ↓
Return to user

Code Flow:
supervisor.route_task({
    type: "create_and_post_video",
    input: { topic, platform },
    required_capabilities: ["video_generation", "social_posting"]
}) → Routes to appropriate agents
```

---

## 💰 MONETIZATION ACROSS ECOSYSTEM

### Token-Based Economy (Unified Across Bubbles)

```
User Budget: $100 = 1000 Tokens

Usage Tracking:
- JAAZ Video: 10 tokens/video
- POSTIZ Social Post: 0.5 tokens/post
- Script Generation: 1 token
- Image Generation: 2 tokens
- LiteLLM Premium Model: +50% overhead
- Storage: 0.01 tokens/GB

Usage Cost Calculation (from litellm_router_service):
Cost = base_task_cost × model_premium_factor × quality_level

Payment Integration (Stripe):
User dashboard shows:
  - Tokens used across all bubbles
  - Cost breakdown by bubble
  - Monthly spending vs budget
  - 1-click recharge via Stripe

Token Tracking Across Bubbles:
1. JAAZ generates video
   → Records: 10 tokens consumed
   → Updates: User balance
   → Triggers: Webhook if <100 tokens remaining
   → Feeds: Central dashboard metrics

2. POSTIZ schedules content
   → Records: 0.5 tokens × quantity
   → Updates: User balance
   → Cross-reference: Shared database

3. LiteLLM tracks model usage
   → Records: API costs → Convert to tokens
   → Updates: Central cost tracking
   → Analytics: Available to all bubbles
```

---

## 🚀 IMPLEMENTATION ROADMAP

### IMMEDIATE (This Month)
- [ ] Create this Ecosystem Blueprint (DONE)
- [ ] Restore deleted components from backup (POSTIZ architecture analysis)
- [ ] Map current integrations visually
- [ ] Document bubble integration contracts

### PHASE 1: Foundation (1-2 Months)
- [ ] Set up Turborepo with pnpm workspaces
- [ ] Extract `motion-primitives` package
- [ ] Extract `ecosystem-types` package
- [ ] Extract `litellm-router` package
- [ ] Migrate `react/` → `apps/web/`
- [ ] Migrate `server/` → `apps/server/`
- [ ] Update build pipeline (monorepo-aware)

### PHASE 2: POSTIZ Integration (1 Month)
- [ ] Restore POSTIZ app source
- [ ] Create `apps/postiz/` (separate web app)
- [ ] Build POST `/api/postiz/*` routes
- [ ] Integrate Stripe token tracking
- [ ] Create POSTIZ ↔ Shared Backend communication

### PHASE 3: Google Cloud Migration (1-2 Months)
- [ ] Set up GCP buckets (raw, derived, renders)
- [ ] Create Cloud Run deployments
- [ ] Set up Pub/Sub topics for events
- [ ] Implement Cloud Workflows orchestration
- [ ] Migrate from local storage to GCS

### PHASE 4: Advanced Features (2+ Months)
- [ ] Real-time collaboration (WebSocket sync)
- [ ] Predictive rendering pipeline
- [ ] Advanced quality control
- [ ] Analytics bubble (metrics aggregation)
- [ ] Designer bubble (template system)

---

## 📊 SHARED ECOSYSTEM APIS

All bubbles access these core APIs:

```
Authentication:
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me
  POST   /api/auth/refresh
  
User Management:
  GET    /api/users/{id}
  PUT    /api/users/{id}
  GET    /api/users/{id}/quota
  
Payment & Tokens:
  GET    /api/payments/balance
  POST   /api/payments/recharge
  GET    /api/payments/history
  GET    /api/payments/breakdown (by bubble)
  
Webhooks:
  POST   /api/webhooks/register
  GET    /api/webhooks/list
  POST   /api/webhooks/test
  DELETE /api/webhooks/{id}
  
Agents (Supervisor):
  POST   /api/agents/route (supervisor routes task)
  GET    /api/agents/list
  GET    /api/agents/{id}/capabilities
  POST   /api/agents/{id}/invoke
  
LiteLLM (Model Routing):
  GET    /api/models/available
  POST   /api/models/best-fit (with task description)
  GET    /api/models/usage
  
Storage:
  POST   /api/storage/upload
  GET    /api/storage/{fileId}
  DELETE /api/storage/{fileId}
  
Notifications:
  POST   /api/notifications/send
  GET    /api/notifications/list
  
Analytics:
  GET    /api/analytics/usage (all bubbles)
  GET    /api/analytics/costs
  GET    /api/analytics/performance
```

---

## 🔐 BUBBLE-TO-ECOSYSTEM SECURITY

```
Authentication Flow:
1. User logs in (any bubble)
2. Ecosystem issues JWT token + refresh token
3. Token contains user_id, scopes, bubble_permissions
4. Token stored in secure HttpOnly cookie
5. Each request includes token
6. Ecosystem validates token, checks scope
7. Service-to-service: API keys (registered in ecosystem)

Scopes per Bubble:
- jaaz:edit (create/edit videos)
- jaaz:export (download videos)
- postiz:schedule (schedule posts)
- postiz:analytics (view performance)
- payments:view (see costs)
- admin:manage (manage workspace)

Cross-Bubble Authorization:
If POSTIZ wants to call JAAZ API:
  ← Must have service-to-service API key
  ← That key has jaaz:* scopes
  ← Request is logged for audit
  ← Cost is charged to originating user/workspace
```

---

## 📝 NEXT STEPS

1. **Review & Approve**: This blueprint represents the ecosystem vision
2. **Restore Components**: Recover POSTIZ from backup, understand architecture
3. **Plan Migration**: Decide on timing for monorepo migration
4. **Set Priorities**: Which bubble to build next (likely POSTIZ)?
5. **Create Technical Specs**: For each bubble's API contract

---

## 📚 REFERENCE DOCUMENTS

- ✅ `docs/agents.md` - Agent Capability Matrix
- ✅ `docs/universal-ai-video-upgrade-plan.md` - 7-phase technical roadmap
- ✅ `docs/founder-agent.md` - Synthia persona & orchestration
- ✅ `docs/TECHNICAL-ARCHITECTURE.md` - Current system design
- 📚 `KUPURI MEDIA MASTER FILES/KUPURI STUDIOS 2.1 VERSION/` - Production reference

---

**This blueprint defines the path from current monolithic app to a full creative studio operating system. Each bubble is independent yet interconnected through the shared ecosystem backbone.**
