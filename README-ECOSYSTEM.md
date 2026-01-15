# 🎪 KUPURI STUDIOS - Creative AI Ecosystem

**Status**: Architecture & Design Phase Complete | Ready for Component Restoration

---

## 🎯 What is Kupuri Studios?

**Kupuri Studios** is an integrated operating system for creative content creators - think Microsoft Office, Apple Suite, or Google Workspace but for AI-powered creative tools.

### The Ecosystem Vision

Instead of separate disconnected apps, Kupuri provides:

- **JAAZ Bubble** → AI Video Creation Suite
- **POSTIZ Bubble** → Social Media Automation
- **[Future] Designer Bubble** → Graphic Design Studio  
- **[Future] Analytics Bubble** → Performance Metrics
- **[And more bubbles...]**

All **connected via shared backend**, **unified authentication**, **single token economy**, and **intelligent agent orchestration**.

---

## 📚 Documentation (Start Here)

### Quick Start Guides
1. **[ECOSYSTEM-ACTION-ITEMS.md](./ECOSYSTEM-ACTION-ITEMS.md)** - What to do next
2. **[SESSION-SUMMARY.md](./SESSION-SUMMARY.md)** - How we got here
3. **[DELIVERABLES-SUMMARY.md](./DELIVERABLES-SUMMARY.md)** - What was created

### Architecture Deep Dives
4. **[KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md](./KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md)** - Complete architecture
5. **[ARCHITECTURE-DIAGRAMS.md](./ARCHITECTURE-DIAGRAMS.md)** - Visual reference
6. **[docs/HOW-TO-ADD-BUBBLE.md](./docs/HOW-TO-ADD-BUBBLE.md)** - Build new bubbles

### Reference Documentation
7. **[docs/agents.md](./docs/agents.md)** - AI agent capabilities
8. **[docs/founder-agent.md](./docs/founder-agent.md)** - Synthia (the cofounder) persona
9. **[docs/universal-ai-video-upgrade-plan.md](./docs/universal-ai-video-upgrade-plan.md)** - 7-phase roadmap
10. **[docs/TECHNICAL-ARCHITECTURE.md](./docs/TECHNICAL-ARCHITECTURE.md)** - Current system design

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│         KUPURI STUDIOS ECOSYSTEM PLATFORM                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┬────────────────┬──────────────┐         │
│  │  JAAZ BUBBLE   │  POSTIZ BUBBLE │  [FUTURE]    │         │
│  │  (Video)       │  (Social)      │  BUBBLES     │         │
│  └────────┬───────┴────────┬───────┴──────┬───────┘         │
│           │                │              │                 │
│           └────────────────┼──────────────┘                 │
│                            │                                │
│        ┌───────────────────▼────────────────┐              │
│        │  SHARED ECOSYSTEM BACKBONE          │              │
│        │  ┌──────────────────────────────┐  │              │
│        │  │ API Layer (Auth, Payments)   │  │              │
│        │  │ LiteLLM Router (AI Models)   │  │              │
│        │  │ Agent Supervisor (Tasks)     │  │              │
│        │  │ Webhooks (Events)            │  │              │
│        │  └──────────────────────────────┘  │              │
│        │  ┌──────────────────────────────┐  │              │
│        │  │ PostgreSQL Database          │  │              │
│        │  │ Redis Cache                  │  │              │
│        │  │ File Storage                 │  │              │
│        │  └──────────────────────────────┘  │              │
│        └──────────────────────────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Status | Description |
|-----------|--------|-------------|
| **JAAZ** | ✅ Ready | Video creation with cloud APIs, script generation |
| **LiteLLM Router** | ✅ Ready | Smart model selection (Claude, GPT-4, Gemini, etc) |
| **Motion Primitives** | ✅ Ready | Reusable UI component library |
| **Agent Supervisor** | ✅ Ready | Task routing and orchestration |
| **Shared Auth** | ✅ Ready | JWT tokens valid everywhere |
| **Shared Payments** | ✅ Ready | Token economy across all bubbles |
| **POSTIZ** | 🔲 Backup | Social media automation (need to restore) |
| **Monorepo** | 🔲 Planned | Turborepo migration (Phase 1) |

---

## 🔗 How Bubbles Connect

### Communication Patterns

**Pattern 1: Direct Backend Calls**
```python
# JAAZ needs smart model selection
from litellm_router_service import LiteLLMRouter
model = LiteLLMRouter().get_best_model(task_type="creative")
```

**Pattern 2: REST API Over HTTP**
```javascript
// POSTIZ checks user quota
const response = await fetch('/api/ecosystem/auth/validate', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Pattern 3: Event-Driven (Webhooks)**
```
JAAZ finishes video → Triggers webhook "video.complete"
  → Ecosystem routes to POSTIZ subscriber
  → POSTIZ gets: "Video ready for scheduling"
  → POSTIZ auto-schedules to social media
```

**Pattern 4: Agent-Coordinated**
```
User: "Create and post a video"
  → Supervisor Agent routes:
    - Script generation → Claude
    - Video creation → JAAZ bubble
    - Caption generation → Gemini
    - Social scheduling → POSTIZ bubble
  → Returns: "Done! Posted to 3 platforms"
```

---

## 💰 Token Economy

Single unified token system across all bubbles:

```
User Budget: 1000 Tokens = $100 USD

Cost Examples:
- JAAZ: 10 tokens/video
- POSTIZ: 0.5 tokens/post  
- LiteLLM Premium Model: +50% overhead
- Storage: 0.01 tokens/GB

User Dashboard Shows:
- Total balance: 500 tokens remaining
- JAAZ usage: 250 tokens
- POSTIZ usage: 50 tokens
- Total spent: 500 tokens
- Breakdown by feature
```

All bubbles deduct from same balance. Payments integrated via Stripe.

---

## 🚀 Getting Started

### For Understanding the Vision
1. Read [SESSION-SUMMARY.md](./SESSION-SUMMARY.md) (5 min)
2. View [ARCHITECTURE-DIAGRAMS.md](./ARCHITECTURE-DIAGRAMS.md) (10 min)
3. Read [KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md](./KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md) (30 min)

### For Building New Features
1. Check [ECOSYSTEM-ACTION-ITEMS.md](./ECOSYSTEM-ACTION-ITEMS.md) for priorities
2. Follow [docs/HOW-TO-ADD-BUBBLE.md](./docs/HOW-TO-ADD-BUBBLE.md) to add new bubble
3. Reference existing JAAZ for integration patterns

### For Deployment
1. Check [docs/TECHNICAL-ARCHITECTURE.md](./docs/TECHNICAL-ARCHITECTURE.md)
2. Review [docs/universal-ai-video-upgrade-plan.md](./docs/universal-ai-video-upgrade-plan.md) Phase 1-3

---

## 📊 Project Structure

```
kupuri-studios/
├── react/                           # Main frontend (Vite)
│   ├── src/
│   │   ├── pages/                  # JAAZ, Settings, Dashboard
│   │   ├── components/             # Using Motion Primitives
│   │   ├── stores/                 # Zustand state (auth, payments)
│   │   └── api/                    # Ecosystem + bubble endpoints
│   └── package.json
│
├── server/                          # FastAPI backend
│   ├── routers/                    # 24 API routes
│   ├── services/                   # 27 services (JAAZ, LiteLLM, etc)
│   ├── models/                     # Data models
│   ├── database/                   # SQLAlchemy + PostgreSQL
│   ├── workflows/                  # Agent orchestration
│   └── main.py
│
├── docs/                            # Complete documentation
│   ├── agents.md                   # AI agent matrix
│   ├── founder-agent.md            # Synthia persona
│   ├── TECHNICAL-ARCHITECTURE.md   # System design
│   └── universal-ai-video-upgrade-plan.md # Roadmap
│
├── KUPURI MEDIA MASTER FILES/       # Reference & backup
│   ├── KUPURI STUDIOS 2.1 VERSION/  # Production reference
│   ├── postiz-app-main/            # [Need to restore]
│   └── [other references]
│
├── KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md  # Full architecture
├── ECOSYSTEM-ACTION-ITEMS.md              # Roadmap
├── ARCHITECTURE-DIAGRAMS.md               # Visual reference
├── SESSION-SUMMARY.md                     # How we got here
└── DELIVERABLES-SUMMARY.md                # What was created
```

---

## 🎯 Current Status

### ✅ Completed
- Architecture design finalized
- 27 backend services mapped
- Integration patterns documented
- 5 comprehensive guides created
- 79KB of documentation
- 4 git commits tracking progress
- 950MB of unnecessary files removed

### ⏳ In Progress
- Restoring POSTIZ from backup (need workspace access)
- Analyzing Motion Primitives (need workspace access)
- Planning monorepo migration

### 🔲 Not Started
- Implementing Turborepo structure
- Restoring POSTIZ integration
- Testing cross-bubble communication
- Google Cloud migration
- Advanced features (real-time collab, etc)

---

## 🔧 Tech Stack

### Frontend
- React 19 + Vite
- TanStack Router (routing)
- Zustand (state management)
- Motion (animations)
- Tailwind CSS (styling)
- TypeScript

### Backend
- FastAPI (Python)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- LiteLLM (model routing)
- LangGraph (AI workflows)

### AI/Integration
- Claude (Anthropic)
- GPT-4 (OpenAI)
- Gemini (Google)
- HeyGen (video)
- ElevenLabs (voice)
- Whisper (transcription)

### Deployment
- Docker (containerization)
- Coolify (self-hosted PaaS)
- PostgreSQL (self-hosted DB)
- Stripe (payments)

---

## 🤝 Contributing

To add a new bubble application:
1. Follow [docs/HOW-TO-ADD-BUBBLE.md](./docs/HOW-TO-ADD-BUBBLE.md)
2. Use Motion Primitives for UI consistency
3. Connect to shared backend
4. Implement webhook handlers
5. Test cross-bubble communication

---

## 📞 Support

- **Architecture questions**: See [KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md](./KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md)
- **Building bubbles**: See [docs/HOW-TO-ADD-BUBBLE.md](./docs/HOW-TO-ADD-BUBBLE.md)
- **Vision/direction**: See [SESSION-SUMMARY.md](./SESSION-SUMMARY.md)
- **Roadmap**: See [ECOSYSTEM-ACTION-ITEMS.md](./ECOSYSTEM-ACTION-ITEMS.md)
- **AI agents**: See [docs/agents.md](./docs/agents.md)
- **Technical details**: See [docs/TECHNICAL-ARCHITECTURE.md](./docs/TECHNICAL-ARCHITECTURE.md)

---

## 📈 Phase Roadmap

| Phase | Timeline | Goals |
|-------|----------|-------|
| **1: Foundation** | 1-2 months | Monorepo setup, shared packages |
| **2: POSTIZ** | 1 month | Restore & integrate social bubble |
| **3: GCP** | 1-2 months | Cloud infrastructure migration |
| **4: Services** | 2 months | WhisperX, scene detection, etc |
| **5: Frontend** | 1 month | Voice-first editor, AI assistant |
| **6: Monetization** | 1 month | Stripe integration, token ecosystem |
| **7: Advanced** | 2+ months | Collaboration, predictive rendering, QC |

---

## ✨ Vision

**Build an operating system for creative studios where**:
- Multiple independent apps work seamlessly together
- One unified user experience across all tools
- Single payment system (token-based)
- Smart AI routing for optimal model selection
- Webhook-based communication between bubbles
- Agent-coordinated multi-step workflows
- Professional-grade output for studios

**Result**: A complete creative platform comparable to:
- Microsoft Office (Word, Excel, PowerPoint)
- Apple Suite (Mail, Calendar, Notes)
- Google Workspace (Docs, Sheets, Slides)

But specialized for **AI-powered creative content creation**.

---

**Last Updated**: January 14, 2026 | **Status**: Architecture Phase Complete

*For detailed implementation roadmap, see [ECOSYSTEM-ACTION-ITEMS.md](./ECOSYSTEM-ACTION-ITEMS.md)*
