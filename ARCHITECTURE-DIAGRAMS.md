# KUPURI STUDIOS ECOSYSTEM - VISUAL ARCHITECTURE

## 🏗️ High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     KUPURI STUDIOS ECOSYSTEM PLATFORM                       │
│                                                                             │
│  One Integrated Creative Operating System (like Microsoft Office)          │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                │                       │                       │
         ┌──────▼──────┐         ┌──────▼──────┐         ┌──────▼──────┐
         │  JAAZ BUBBLE │         │ POSTIZ BUBBLE│         │ [FUTURE]   │
         │   (VIDEO)    │         │ (SOCIAL)     │         │ BUBBLES    │
         └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
                │                       │                       │
                └───────────────────────┼───────────────────────┘
                                        │
                        ┌───────────────▼───────────────┐
                        │                               │
                        │   SHARED ECOSYSTEM BACKBONE   │
                        │                               │
                        │  ┌─────────────────────────┐  │
                        │  │   API Gateway           │  │
                        │  │  /api/auth              │  │
                        │  │  /api/payments          │  │
                        │  │  /api/webhooks          │  │
                        │  └─────────────────────────┘  │
                        │                               │
                        │  ┌─────────────────────────┐  │
                        │  │  Core Services          │  │
                        │  │  - Authentication       │  │
                        │  │  - Payment Processing   │  │
                        │  │  - Webhook Hub          │  │
                        │  │  - Agent Supervisor     │  │
                        │  │  - LiteLLM Router       │  │
                        │  └─────────────────────────┘  │
                        │                               │
                        │  ┌─────────────────────────┐  │
                        │  │  Data Layer             │  │
                        │  │  - PostgreSQL           │  │
                        │  │  - Redis Cache          │  │
                        │  │  - File Storage         │  │
                        │  └─────────────────────────┘  │
                        │                               │
                        └───────────────────────────────┘
```

---

## 🎪 Bubble App Architecture (Detailed)

```
┌────────────────────────────────────────────────────────────┐
│         BUBBLE APP INSTANCE (e.g., JAAZ or POSTIZ)        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         FRONTEND (React + Vite)                      │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │ │
│  │  │  Editor    │  │  Library   │  │ Dashboard  │    │ │
│  │  │   Page     │  │    Page    │  │   Page     │    │ │
│  │  └────────────┘  └────────────┘  └────────────┘    │ │
│  │                                                      │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  Shared Components (Motion Primitives)       │  │ │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐        │  │ │
│  │  │  │Button  │  │Layout  │  │Modal   │  ...   │  │ │
│  │  │  └────────┘  └────────┘  └────────┘        │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                      │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  State Management (Zustand + React Query)    │  │ │
│  │  │  └──> useAuthStore                           │  │ │
│  │  │  └──> useBubbleStore                         │  │ │
│  │  │  └──> usePaymentsStore                       │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────┘ │
│                          │                                │
│         ┌────────────────┼────────────────┐             │
│         │                │                │             │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐   │
│  │  Ecosystem  │  │  LiteLLM    │  │   Bubble    │   │
│  │  APIs       │  │   Router    │  │   Services  │   │
│  │             │  │             │  │             │   │
│  │ /api/auth   │  │ /api/models │  │ /api/jaaz   │   │
│  │ /api/pay*   │  │ /api/best*  │  │ /api/video  │   │
│  │ /api/agent* │  │             │  │ /api/assets │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │         │
└─────────┼────────────────┼────────────────┼─────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
              SHARED ECOSYSTEM BACKEND
                     (see above)
```

---

## 📡 Communication Patterns Between Bubbles

### Pattern 1: Direct Bubble-to-Bubble (Same Deployment)
```
JAAZ Frontend
    ↓
  JAAZ Backend Service
    ↓
  Uses: LiteLLM Router (Python import)
    ↓
  Returns: Best Model Config
    ↓
  JAAZ generates video with selected model
```

### Pattern 2: Cross-Bubble REST API (Different Deployment)
```
POSTIZ Frontend
    ↓
  Calls: POST /api/ecosystem/auth/validate
    ↓
  Shared Ecosystem Backend
    ↓
  Returns: { valid: true, user_quota: 500 }
    ↓
  POSTIZ knows user can proceed
```

### Pattern 3: Event-Driven (Webhook)
```
Event: JAAZ finishes video generation
    ↓
POST /ecosystem/webhooks/video.complete
    ↓
Ecosystem Webhook Hub checks subscriptions
    ↓
Finds: POSTIZ subscribed to video.complete
    ↓
POST https://postiz.api/webhooks/video-ready
    ↓
POSTIZ receives event: "video is ready for scheduling"
    ↓
POSTIZ auto-schedules video to social platforms
```

### Pattern 4: Agent-Coordinated (Complex Tasks)
```
User: "Create and post a video about AI"
    ↓
Submitted to: Supervisor Agent
    ↓
Supervisor decomposes into:
  - Task A: Generate video script (use Claude)
  - Task B: Create video from script (route to JAAZ)
  - Task C: Create social captions (use Gemini)
  - Task D: Schedule posts (route to POSTIZ)
    ↓
Execute tasks in sequence/parallel
    ↓
Aggregate results
    ↓
Return: "Video created and scheduled to 3 platforms"
```

---

## 💰 Token Economy Flow

```
┌─────────────────────────────────────────────────────────┐
│           USER ACCOUNT (Unified Token Balance)          │
│                                                         │
│  Total Budget: 1000 Tokens (= $100 @ standard pricing) │
└──────────────┬──────────────────────────────────────────┘
               │
    ┌──────────┼──────────┬─────────────┐
    │          │          │             │
┌───▼────┐ ┌──▼────┐ ┌───▼────┐  ┌─────▼──┐
│  JAAZ  │ │POSTIZ │ │Designer│  │Analytics│
│ Usage  │ │Usage  │ │ Usage  │  │ Usage   │
│ 100 tk │ │ 50 tk │ │ 0 tk   │  │ 0 tk    │
└────┬───┘ └──┬────┘ └────┬────┘  └────┬────┘
     │        │           │            │
     └────────┼───────────┼────────────┘
              │
         ┌────▼──────┐
         │  Balance  │
         │  = 850 tk │
         └───────────┘
              │
        ┌─────▼──────┐
        │ Dashboard  │
        │  shows all │
        │ activity   │
        └────────────┘
```

**Token Pricing** (examples):
```
JAAZ Video Generation:
  - Standard quality: 5 tokens/minute
  - HD quality: 10 tokens/minute
  - Premium model: +50% overhead
  - Example: 5min HD video with Claude = 10 × 1.5 = 15 tokens

POSTIZ Social Posts:
  - Simple scheduling: 0.5 tokens/post
  - With AI captions: 1 token/post
  - Premium model: +50% overhead
  - Example: Caption with GPT-4 = 1 × 1.5 = 1.5 tokens

LiteLLM Model Selection:
  - Free tier model (DeepSeek, Gemini Flash): 0 overhead
  - Standard model (Claude 3.5 Sonnet): +25% overhead
  - Premium model (GPT-4o): +50% overhead

Total Cost = Base Task Cost × Model Premium × Quality Factor
```

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────┐
│          ECOSYSTEM AUTHENTICATION SYSTEM                │
│                                                         │
│  ALL bubbles use SAME token system                      │
└─────────────────────────────────────────────────────────┘

USER LOGS IN (any bubble):
    ↓
POST /api/auth/login {email, password}
    ↓
Ecosystem validates credentials
    ↓
Issues JWT Token containing:
  {
    user_id: "usr_123",
    email: "user@example.com",
    scopes: [
      "jaaz:edit",      // Can edit videos
      "jaaz:export",    // Can export videos
      "postiz:post",    // Can schedule posts
      "payments:view"   // Can view own costs
    ],
    exp: 3600
  }
    ↓
Token stored in HttpOnly cookie (secure)
    ↓
Token sent with EVERY request:
  Authorization: Bearer [JWT TOKEN]
    ↓
Ecosystem validates token on each request
    ↓
Routes check scopes: "Does user have jaaz:edit?"
    ↓
Allow/deny based on scopes
    ↓
Track usage for token deduction
    ↓
Usage: -10 tokens for this operation
```

**Scope Hierarchy**:
```
- admin:*          (all permissions)
  ├─ jaaz:*        (all JAAZ permissions)
  │  ├─ jaaz:edit
  │  ├─ jaaz:export
  │  └─ jaaz:share
  ├─ postiz:*      (all POSTIZ permissions)
  │  ├─ postiz:post
  │  ├─ postiz:schedule
  │  └─ postiz:analytics
  └─ payments:*    (all payment permissions)
     ├─ payments:view
     └─ payments:manage
```

---

## 📊 Data Flow for Complex Operation

**Example: "Create a video and post it to Twitter & Instagram"**

```
User: "Create and post video about AI trends"
    │
    ├─► FRONTEND (JAAZ or Dashboard)
    │   └─► Calls: POST /api/agents/route
    │       Request: {
    │         task: "create_and_post_video",
    │         topic: "AI trends",
    │         platforms: ["twitter", "instagram"]
    │       }
    │
    └─► BACKEND (Ecosystem)
        │
        ├─► Supervisor Agent receives task
        │   └─► Decomposes into:
        │       - Task1: Write video script
        │       - Task2: Generate video
        │       - Task3: Create captions
        │       - Task4: Schedule posts
        │
        ├─► Task1: Write Script
        │   ├─► LiteLLM Router: "Which model for creative writing?"
        │   │   └─► Returns: Claude-3.5-Sonnet (best for creative)
        │   ├─► Calls: Claude with script prompt
        │   └─► Returns: Video script
        │
        ├─► Task2: Generate Video (JAAZ Bubble)
        │   ├─► POST /api/jaaz/generate {script}
        │   ├─► JAAZ Service receives request
        │   ├─► Calls Cloud Video API
        │   ├─► Deducts 10 tokens from user
        │   ├─► Returns: Video file ID
        │   └─► Triggers Webhook: video.complete
        │
        ├─► Task3: Create Captions
        │   ├─► LiteLLM Router: "Which model for captions?"
        │   │   └─► Returns: Gemini-2.0-Flash (fast, cheap)
        │   ├─► Calls: Gemini with video script
        │   └─► Returns: Captions for Twitter & Instagram
        │
        ├─► Task4: Schedule Posts (POSTIZ Bubble)
        │   ├─► POST /api/postiz/schedule-video
        │   │   {video_id, captions, platforms}
        │   ├─► POSTIZ Service receives request
        │   ├─► Validates user has POSTIZ permission
        │   ├─► Deducts 0.5 tokens per platform
        │   ├─► Calls Twitter API
        │   ├─► Calls Instagram API
        │   ├─► Creates database records
        │   └─► Returns: Post IDs on each platform
        │
        ├─► Supervisor Aggregates Results:
        │   {
        │     status: "success",
        │     video_id: "vid_xyz",
        │     platforms: [
        │       {platform: "twitter", post_id: "tw_123"},
        │       {platform: "instagram", post_id: "ig_456"}
        │     ],
        │     tokens_used: 11.5  // Script(1) + Video(10) + Posts(0.5)
        │   }
        │
        └─► Returns to FRONTEND
            └─► Display: "Video created and posted to 2 platforms!"
                         "Used 11.5 tokens. Balance: 988.5"
                         (with links to view on Twitter/Instagram)
```

---

## 🔌 How New Bubbles Get Added

```
STEP 1: Create New Bubble
    ├─ Create React Vite app
    ├─ Create FastAPI services (if needed)
    └─ Register routes with ecosystem

STEP 2: Connect to Shared Backend
    ├─ Use shared auth (get JWT token)
    ├─ Register bubble-specific routes
    ├─ Connect to shared database
    └─ Implement token tracking

STEP 3: Use Shared Components
    ├─ Import Motion Primitives
    ├─ Use shared layouts
    ├─ Use shared modals
    └─ Use shared theme

STEP 4: Integrate LiteLLM
    ├─ Import LiteLLMRouter
    ├─ Call get_best_model()
    ├─ Use selected model for AI tasks
    └─ Track usage

STEP 5: Register Webhooks (if needed)
    ├─ Listen for ecosystem events
    ├─ Trigger actions on other bubbles
    └─ Send events to other bubbles

RESULT: New bubble is now part of ecosystem
         - Authenticated users
         - Shared token system
         - Cross-bubble communication
         - Unified dashboard
```

---

**This visual architecture shows how Kupuri Studios works as an integrated ecosystem where multiple independent applications share a common backbone and seamlessly work together.**

