# KUPURI STUDIOS: HOW TO ADD A NEW BUBBLE APP
## Step-by-Step Integration Guide

---

## Overview: What is a "Bubble"?

A **Bubble** is an independent application that:
- ✅ Has its own frontend (React app)
- ✅ Has its own business logic (services)
- ✅ Has its own API routes
- ✅ Connects to shared ecosystem backend
- ✅ Uses shared LiteLLM router for AI
- ✅ Uses shared authentication & payments
- ✅ Appears as separate tab/section in ecosystem
- ✅ Shares Motion Primitives component library

**Examples**:
- JAAZ = Video Creation Bubble
- POSTIZ = Social Media Automation Bubble
- [Future] Designer = Graphic Design Bubble
- [Future] Analytics = Metrics & Reporting Bubble

---

## Architecture: Bubble Component Structure

```
Bubble App (Standalone)
│
├─ Frontend (React + Vite)
│  ├─ Bubble-specific pages & components
│  ├─ Uses Motion Primitives for UI
│  ├─ Calls shared /api/ecosystem/* endpoints
│  └─ Calls bubble-specific /api/[bubble]/* endpoints
│
├─ Backend Services (Optional, for complex logic)
│  ├─ Bubble-specific business logic
│  ├─ Calls LiteLLM Router for AI tasks
│  ├─ Calls shared ecosystem services
│  └─ Implements webhook handlers
│
└─ Integration Points
   ├─ Shared Auth (JWT tokens)
   ├─ Shared Payments (Stripe + Tokens)
   ├─ Shared LiteLLM Router (AI model selection)
   ├─ Shared Agent Supervisor (task routing)
   ├─ Shared Database (PostgreSQL via shared schema)
   └─ Shared Webhooks (event notifications)
```

---

## STEP 1: Create Bubble Frontend

### 1a. Generate Vite React App

```bash
npm create vite@latest [bubble-name] -- --template react-ts

cd [bubble-name]
npm install
```

### 1b. Required Dependencies

```bash
npm install @tanstack/react-router zustand react-query
npm install @jaaz/agent-ui motion axios
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1c. Structure

```
[bubble-name]/
├── src/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Editor.tsx (main workspace)
│   │   ├── Library.tsx (asset/project library)
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   │
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── [bubble-specific components]
│   │   └── common/ (use Motion Primitives here)
│   │
│   ├── api/
│   │   ├── client.ts (axios instance with auth)
│   │   ├── [bubble]Api.ts (bubble-specific calls)
│   │   └── ecosystemApi.ts (shared ecosystem calls)
│   │
│   ├── stores/
│   │   ├── authStore.ts (from ecosystem auth)
│   │   ├── userStore.ts (bubble-specific state)
│   │   └── [feature]Store.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePayments.ts (token usage)
│   │   └── [bubble-specific hooks]
│   │
│   ├── types/
│   │   ├── index.ts (bubble-specific types)
│   │   └── shared.ts (imported from ecosystem-types)
│   │
│   ├── App.tsx (router setup)
│   ├── main.tsx
│   └── index.css (Tailwind + Motion Primitives theme)
│
├── vite.config.ts (configure API proxy)
├── tsconfig.json
├── tailwind.config.js
├── package.json (with @jaaz/agent-ui, motion, ecosystem-types)
└── .env.example
```

### 1d. API Client Setup

```typescript
// src/api/client.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ECOSYSTEM_BASE = import.meta.env.VITE_ECOSYSTEM_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ecosystemClient = axios.create({
  baseURL: ECOSYSTEM_BASE,
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ecosystemClient.interceptors.request.use((config) => {
  const { token } = useAuthStore();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 1e. Routing Setup

```typescript
// src/App.tsx

import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

## STEP 2: Create Backend Services (If Needed)

### 2a. Service Structure

```python
# server/services/[bubble]_service.py

from typing import Optional, Dict, Any
from server.services.litellm_router_service import LiteLLMRouter
from server.services.config_service import ConfigService
from server.services.database_service import DatabaseService

class [Bubble]Service:
    """Main service for [Bubble] functionality"""
    
    def __init__(self):
        self.litellm = LiteLLMRouter()
        self.config = ConfigService()
        self.db = DatabaseService()
        self._is_configured()
    
    def _is_configured(self) -> bool:
        """Check if service has required config"""
        config = self.config.get_config().get('[bubble]', {})
        if not config.get('api_key'):
            raise ValueError(f"[Bubble] API key not configured")
        return True
    
    async def main_operation(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main operation for this bubble
        
        Integrates with:
        - LiteLLM for AI tasks
        - Database for persistence
        - Webhooks for notifications
        """
        
        # Step 1: Use LiteLLM for smart model selection
        best_model = self.litellm.get_best_model(
            task_type="[your_task]",
            budget="standard",
            requirements={"vision": False}
        )
        
        # Step 2: Do your business logic
        result = await self._process(input_data, best_model)
        
        # Step 3: Save to database
        await self.db.save_result(result)
        
        # Step 4: Trigger webhook
        await self._trigger_webhook('[bubble].operation.complete', result)
        
        return result
    
    async def _process(self, data: Dict, model: str) -> Dict:
        """Implementation-specific processing"""
        # Use LiteLLM-selected model
        # Call external APIs
        # Do computation
        pass
    
    async def _trigger_webhook(self, event_type: str, data: Dict):
        """Notify ecosystem of events"""
        # This will be handled by ecosystem webhook hub
        pass
```

### 2b. Router Setup

```python
# server/routers/[bubble]_router.py

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any
from server.services.[bubble]_service import [Bubble]Service
from server.middleware.auth import get_current_user

router = APIRouter(prefix="/api/[bubble]", tags=["[bubble]"])

service = [Bubble]Service()

@router.post("/operation")
async def create_operation(
    request: OperationRequest,
    user = Depends(get_current_user)
) -> OperationResponse:
    """
    Execute [bubble] operation
    
    Token Cost: Based on operation complexity
    Deducted from user's account automatically
    """
    try:
        # Validate user has quota
        await check_user_quota(user.id, estimated_cost=10)  # tokens
        
        # Execute operation
        result = await service.main_operation(request.dict())
        
        # Track usage (for dashboard)
        await track_usage(
            user_id=user.id,
            bubble="[bubble]",
            operation="operation",
            cost_tokens=result.get("tokens_used", 10),
            success=True
        )
        
        return OperationResponse(**result)
        
    except Exception as e:
        await track_usage(user_id=user.id, success=False, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status/{operation_id}")
async def get_operation_status(
    operation_id: str,
    user = Depends(get_current_user)
) -> OperationStatus:
    """Check status of async operation"""
    status = await service.get_operation_status(operation_id)
    # Verify user owns this operation
    if status.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return status

@router.get("/library")
async def get_user_library(
    user = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
) -> LibraryResponse:
    """Get user's items in this bubble"""
    items = await service.get_user_items(user.id, skip, limit)
    return LibraryResponse(items=items, total=len(items))
```

### 2c. Register Routes in Main App

```python
# server/register_routers.py (existing file)

from server.routers.[bubble]_router import router as bubble_router

def register_routers(app):
    # ... existing routers ...
    app.include_router(bubble_router)
```

---

## STEP 3: Integrate with Shared Backend

### 3a. Authentication

```python
# In your bubble router, after user action:

from server.middleware.auth import verify_user_token, issue_refresh_token

@router.post("/auth/login")
async def login(credentials: LoginRequest) -> AuthResponse:
    """
    Login for this bubble
    
    Returns: JWT token valid across entire ecosystem
    """
    user = await authenticate_user(credentials.email, credentials.password)
    
    token = issue_jwt_token(
        user_id=user.id,
        scopes=[
            f"{bubble_name}:*",  # All permissions in this bubble
            "payments:view",      # View own costs
        ]
    )
    
    return AuthResponse(token=token, user=user)
```

### 3b. Payment/Token Tracking

```python
# In your operation endpoint:

from server.services.payments_service import PaymentsService
from server.routers.payments_router import calculate_operation_cost

payments = PaymentsService()

@router.post("/operation")
async def create_operation(
    request: OperationRequest,
    user = Depends(get_current_user)
) -> OperationResponse:
    
    # BEFORE: Check if user has quota
    estimated_cost = calculate_operation_cost(
        bubble="[bubble]",
        operation_type=request.type,
        complexity=request.complexity
    )
    
    balance = await payments.get_user_balance(user.id)
    if balance < estimated_cost:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient tokens. Need {estimated_cost}, have {balance}"
        )
    
    # Execute
    result = await service.operation(request)
    actual_cost = calculate_operation_cost(
        bubble="[bubble]",
        operation_type=request.type,
        complexity=request.complexity,
        result_data=result
    )
    
    # AFTER: Deduct actual cost
    await payments.deduct_tokens(
        user_id=user.id,
        amount=actual_cost,
        reason=f"[bubble] operation: {request.type}",
        bubble="[bubble]"
    )
    
    return result
```

### 3c. LiteLLM Integration

```python
# In your service when you need AI:

from server.services.litellm_router_service import LiteLLMRouter

class MyBubbleService:
    def __init__(self):
        self.litellm = LiteLLMRouter()
    
    async def generate_content(self, prompt: str) -> str:
        """Use best available model for content generation"""
        
        # Get optimal model for this task
        model_config = self.litellm.get_best_model(
            task_type="creative",
            budget="standard",
            requirements={
                "max_tokens": 2000,
                "temperature": 0.7
            }
        )
        
        # Use selected model
        response = await self.litellm.call_model(
            model=model_config['name'],
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content
```

### 3d. Agent Supervisor Integration

```python
# When you need to route a complex task across bubbles:

from server.routers.supervisor_router import route_task

@router.post("/complex-operation")
async def complex_operation(
    request: ComplexRequest,
    user = Depends(get_current_user)
):
    """
    Complex task that might need other bubbles
    Example: Create video (JAAZ) + Post to social (POSTIZ)
    """
    
    task_plan = await route_task(
        task_type="create_and_post_video",
        user_id=user.id,
        input=request.dict(),
        required_bubbles=["jaaz", "postiz"]
    )
    
    # Supervisor will:
    # 1. Break down into subtasks
    # 2. Call JAAZ bubble endpoint
    # 3. Call POSTIZ bubble endpoint
    # 4. Coordinate between them
    # 5. Return aggregated result
    
    return await task_plan.execute()
```

---

## STEP 4: Frontend Integration with Ecosystem

### 4a. Auth Store (from ecosystem)

```typescript
// src/stores/authStore.ts

import { create } from 'zustand';
import { ecosystemClient } from '@/api/client';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  
  login: async (email, password) => {
    // Login endpoint is in ecosystem, returns token valid everywhere
    const response = await ecosystemClient.post('/api/auth/login', {
      email,
      password
    });
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
  
  refreshToken: async () => {
    const response = await ecosystemClient.post('/api/auth/refresh');
    const { token } = response.data;
    localStorage.setItem('token', token);
    set({ token });
  },
  
  isAuthenticated: () => get().token !== null
}));
```

### 4b. Payments Hook

```typescript
// src/hooks/usePayments.ts

import { useQuery } from '@tanstack/react-query';
import { ecosystemClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

export function usePayments() {
  const { token } = useAuthStore();
  
  // Get user's current token balance
  const { data: balance } = useQuery({
    queryKey: ['payments', 'balance'],
    queryFn: async () => {
      const response = await ecosystemClient.get('/api/payments/balance');
      return response.data;
    },
    enabled: !!token,
    refetchInterval: 5000 // refresh every 5s
  });
  
  // Get usage breakdown by bubble
  const { data: breakdown } = useQuery({
    queryKey: ['payments', 'breakdown'],
    queryFn: async () => {
      const response = await ecosystemClient.get('/api/payments/breakdown');
      return response.data; // { jaaz: 250, postiz: 50, designer: 0 }
    },
    enabled: !!token,
    refetchInterval: 10000
  });
  
  // Recharge tokens via Stripe
  const recharge = async (amount: number) => {
    const response = await ecosystemClient.post('/api/payments/recharge', {
      amount,
      currency: 'USD'
    });
    // Returns Stripe checkout URL
    window.location.href = response.data.checkout_url;
  };
  
  return {
    balance: balance?.tokens || 0,
    breakdown: breakdown || {},
    recharge,
    canAfford: (cost: number) => balance?.tokens >= cost
  };
}
```

### 4c. Ecosystem Panel (Shared across all bubbles)

```typescript
// src/components/EcosystemPanel.tsx

import { usePayments } from '@/hooks/usePayments';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'motion/react';

export function EcosystemPanel() {
  const { user, logout } = useAuthStore();
  const { balance, breakdown, recharge } = usePayments();
  
  return (
    <motion.div
      className="fixed top-4 right-4 p-4 bg-white rounded-lg shadow"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="space-y-2">
        <div>
          <h3 className="font-bold">{user?.name}</h3>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        
        <div className="border-t pt-2">
          <p className="text-lg font-bold">Tokens: {balance}</p>
          <p className="text-xs text-gray-500">
            {breakdown.jaaz || 0} JAAZ | 
            {breakdown.postiz || 0} POSTIZ
          </p>
        </div>
        
        <button
          onClick={() => recharge(50)}
          className="text-sm text-blue-500"
        >
          + Recharge Tokens
        </button>
        
        <button
          onClick={logout}
          className="text-sm text-red-500"
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
}
```

---

## STEP 5: Environment Configuration

### 5a. Frontend .env

```bash
# .env.local

# API endpoints
VITE_API_URL=http://localhost:8000
VITE_ECOSYSTEM_URL=http://localhost:8000

# Bubble config
VITE_BUBBLE_NAME=[bubble-name]
VITE_BUBBLE_ID=[bubble-id]

# Feature flags
VITE_ENABLE_WEBHOOKS=true
VITE_ENABLE_ANALYTICS=true
```

### 5b. Backend .env

```bash
# .env

# Bubble config
[BUBBLE]_API_KEY=your-api-key
[BUBBLE]_API_URL=https://api.service.com

# LiteLLM (shared)
LITELLM_API_KEY=sk-...
LITELLM_PROXY_URL=http://localhost:4000

# Ecosystem
ECOSYSTEM_DATABASE_URL=postgresql://...
ECOSYSTEM_JWT_SECRET=secret-key
STRIPE_SECRET_KEY=sk_...
```

---

## STEP 6: Webhook Handlers (For Cross-Bubble Communication)

### 6a. Register Webhook

```python
# In your bubble router on startup:

@app.on_event("startup")
async def register_webhooks():
    """Register for ecosystem events"""
    from server.routers.webhook_router import register_webhook
    
    # Listen for when videos are ready (from JAAZ)
    # This would let POSTIZ auto-schedule them
    await register_webhook(
        event_type="jaaz.video.complete",
        webhook_url="https://[bubble-domain]/webhooks/jaaz-video-ready",
        bubble_id="[bubble-name]"
    )
```

### 6b. Handle Webhook

```python
# server/routers/[bubble]_webhook_router.py

@router.post("/webhooks/jaaz-video-ready")
async def on_jaaz_video_ready(payload: Dict[str, Any]):
    """
    Triggered when JAAZ finishes a video
    Example: POSTIZ wants to auto-schedule it
    """
    video_id = payload['video_id']
    user_id = payload['user_id']
    
    # Verify signature (webhook security)
    if not verify_webhook_signature(payload):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Do something with the video
    await handle_video_ready(user_id, video_id)
    
    return {"status": "ok"}
```

---

## STEP 7: Documentation

Create `docs/[bubble]-integration.md` with:

```markdown
# [Bubble] Integration Guide

## What is [Bubble]?
[Description]

## Features
- Feature 1
- Feature 2

## API Endpoints
- POST /api/[bubble]/operation
- GET /api/[bubble]/status/{id}

## Token Costs
- Operation: X tokens

## Examples
[Code examples]

## Troubleshooting
[Common issues]
```

---

## Checklist: Before Launch

- [ ] Frontend loads without errors
- [ ] Authentication works (can login, get token)
- [ ] API calls work (can call /api/[bubble]/* endpoints)
- [ ] Token deduction works (usage tracked in dashboard)
- [ ] LiteLLM integration works (AI features function)
- [ ] Webhooks work (events are triggered)
- [ ] Error handling is comprehensive
- [ ] Documentation is complete
- [ ] Tests pass
- [ ] Environment config validated

---

## Testing Your Integration

```bash
# 1. Start ecosystem backend
cd server
python main.py

# 2. Start your bubble frontend
cd [bubble-name]
npm run dev

# 3. Test login flow
# 4. Test API calls
# 5. Monitor token deduction
# 6. Check dashboard metrics
```

---

## Getting Help

1. Check existing bubbles (JAAZ) for patterns
2. Review `KUPURI-STUDIOS-ECOSYSTEM-BLUEPRINT.md`
3. Check shared services documentation
4. Review `docs/technical-architecture.md`

**You now have a complete, independent bubble that's fully integrated into the Kupuri Studios ecosystem!**
