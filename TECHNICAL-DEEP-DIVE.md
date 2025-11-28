# Kupuri Studios - Technical Deep Dive: What Makes It Work

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HeroSection          ProjectCard        ThemeToggle         │
│  PricingPage          ProjectModal       Authentication       │
│                                                               │
│  State: Zustand/Context                                      │
│  Animations: Framer Motion                                   │
│  Styling: Tailwind CSS                                       │
│                                                               │
└────────────────┬──────────────────────────────────────────────┘
                 │
          HTTP REST + WebSocket
                 │
┌────────────────▼──────────────────────────────────────────────┐
│            FASTAPI SERVER (Python)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────┐             │
│  │  ROUTERS (Endpoints)                         │             │
│  ├──────────────────────────────────────────────┤             │
│  │  • chat_router.py      (/api/chat)           │             │
│  │  • websocket_router.py (Socket.IO events)    │             │
│  │  • canvas.py           (/api/canvas)         │             │
│  │  • image_router.py     (/api/image)          │             │
│  │  • config_router.py    (/api/config)         │             │
│  │  • settings.py         (/api/settings)       │             │
│  └──────────────────────────────────────────────┘             │
│                       ↓                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  SERVICES (Business Logic)                   │             │
│  ├──────────────────────────────────────────────┤             │
│  │  • chat_service.py                           │             │
│  │  • magic_service.py                          │             │
│  │  • websocket_service.py                      │             │
│  │  • db_service.py                             │             │
│  │  • tool_service.py                           │             │
│  │  • langgraph_service/                        │             │
│  │    └─ agent_service.py (Multi-agent AI)      │             │
│  │    └─ StreamProcessor.py (Real-time output)  │             │
│  │  • config_service.py                         │             │
│  └──────────────────────────────────────────────┘             │
│                       ↓                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  AI ORCHESTRATION                            │             │
│  ├──────────────────────────────────────────────┤             │
│  │  LangGraph Multi-Agent Engine                │             │
│  │  └─ Manages multiple AI models              │             │
│  │  └─ Routes between GPT-4, Claude, etc.      │             │
│  │                                               │             │
│  │  Tool Execution                              │             │
│  │  └─ ComfyUI for image generation             │             │
│  │  └─ Flux for text-to-image                   │             │
│  │  └─ Ollama for local LLMs                    │             │
│  │                                               │             │
│  │  Stream Processor                            │             │
│  │  └─ Real-time token streaming                │             │
│  │  └─ Progress updates to UI                   │             │
│  └──────────────────────────────────────────────┘             │
│                       ↓                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  PERSISTENCE LAYER                           │             │
│  ├──────────────────────────────────────────────┤             │
│  │  SQLite Database (aiosqlite)                 │             │
│  │  └─ Canvases                                 │             │
│  │  └─ Chat Sessions & Messages                │             │
│  │  └─ User Settings                            │             │
│  │  └─ Tool Confirmations                       │             │
│  └──────────────────────────────────────────────┘             │
│                       ↓                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  EXTERNAL APIs                               │             │
│  ├──────────────────────────────────────────────┤             │
│  │  OpenAI (GPT-4, GPT-3.5)                    │             │
│  │  Anthropic (Claude-3)                        │             │
│  │  Stripe (Payment Processing)                 │             │
│  │  ComfyUI (Local Image Generation)            │             │
│  │  Ollama (Local LLMs)                         │             │
│  │  MCP (Model Context Protocol)                │             │
│  └──────────────────────────────────────────────┘             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Frontend-Backend Communication

### **Request/Response Flow**

#### **1. Chat Request (HTTP POST)**
```typescript
// Frontend (React)
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Generate an image...' }],
    session_id: 'sess_xyz',
    canvas_id: 'canvas_abc',
    text_model: { model: 'gpt-4', provider: 'openai' },
    tool_list: [{ model: 'flux', provider: 'comfyui' }],
    system_prompt: 'You are a helpful assistant'
  })
})
```

#### **2. Backend Processing (Python)**
```python
# Backend (chat_router.py)
@router.post("/api/chat")
async def chat(request: Request):
    data = await request.json()
    await handle_chat(data)  # Async task started
    return {"status": "done"}

# chat_service.py
async def handle_chat(data):
    # 1. Parse data
    messages = data.get('messages', [])
    session_id = data.get('session_id', '')
    
    # 2. Save to database
    await db_service.create_chat_session(...)
    await db_service.create_message(...)
    
    # 3. Launch AI agent task
    task = asyncio.create_task(
        langgraph_multi_agent(messages, canvas_id, session_id, ...)
    )
    
    # 4. Register for cancellation support
    add_stream_task(session_id, task)
```

#### **3. Real-Time Streaming (WebSocket)**
```python
# Stream processor sends updates during AI generation
async def stream_processor():
    while streaming:
        # Send token updates in real-time
        await send_to_websocket(session_id, {
            'type': 'token',
            'delta': 'The generated...',
            'index': 42
        })
        
# Frontend receives updates
socket.on('session_update', (data) => {
    if (data.type === 'token') {
        setOutput(prev => prev + data.delta)
    }
})
```

#### **4. Completion Signal (WebSocket)**
```python
# Backend signals completion
await send_to_websocket(session_id, {
    'type': 'done',
    'final_output': 'Complete AI response'
})

# Frontend receives completion
socket.on('session_update', (data) => {
    if (data.type === 'done') {
        setIsLoading(false)
    }
})
```

---

## 🤖 AI Orchestration Engine

### **LangGraph Multi-Agent System**

```python
# langgraph_service/agent_service.py
async def langgraph_multi_agent(messages, canvas_id, session_id, text_model, tool_list):
    
    # 1. Create Language Model Instance
    if text_model['provider'] == 'openai':
        llm = ChatOpenAI(model="gpt-4", temperature=0.7)
    elif text_model['provider'] == 'anthropic':
        llm = ChatAnthropic(model="claude-3", temperature=0.7)
    
    # 2. Create Tool Instances (Image generation, etc.)
    tools = []
    for tool_config in tool_list:
        tool = create_tool(tool_config['model'], tool_config['provider'])
        tools.append(tool)
    
    # 3. Build Agent Graph
    agent_executor = create_swarm(
        llm=llm,
        tools=tools,
        system_prompt=system_prompt
    )
    
    # 4. Run Agent with Streaming
    async for event in agent_executor.stream_events(
        input={'messages': messages},
        config={'configurable': {'thread_id': session_id}}
    ):
        # Process each event
        if event.get('type') == 'on_chat_model_stream':
            token = event['data']['chunk'].content
            # Send to frontend via WebSocket
            await send_to_websocket(session_id, {
                'type': 'token',
                'delta': token
            })
        
        elif event.get('type') == 'on_tool_start':
            tool_name = event['data']['tool']
            # Notify UI tool is executing
            await send_to_websocket(session_id, {
                'type': 'tool_start',
                'tool': tool_name
            })
        
        elif event.get('type') == 'on_tool_end':
            result = event['data']['output']
            # Send tool result back
            await send_to_websocket(session_id, {
                'type': 'tool_result',
                'result': result
            })
```

### **Tool Routing Example**

```python
# User asks: "Generate an image of a sunset"

# 1. Text model (GPT-4) understands intent
# 2. Identifies need for image generation tool
# 3. Routes to Flux/ComfyUI tool
# 4. Flux executes with prompt parameters
# 5. Returns image URL
# 6. Final response sent to user

Message Flow:
User Input → GPT-4 (reasoning) → Flux Tool (execution) → Image Result → UI Display
```

---

## 💾 Database Architecture

### **SQLite Schema**

```sql
-- Canvases (Projects)
CREATE TABLE canvases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Sessions
CREATE TABLE chat_sessions (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    canvas_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id)
);

-- Chat Messages
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,  -- 'user', 'assistant', 'tool'
    message TEXT NOT NULL,  -- JSON serialized message
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- Tool Confirmations (for user approval of tool execution)
CREATE TABLE tool_confirmations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    params JSON NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);
```

### **Database Access (Async)**

```python
# services/db_service.py
async def create_canvas(self, id: str, name: str):
    """Create new canvas with async SQLite"""
    async with aiosqlite.connect(self.db_path) as db:
        await db.execute(
            "INSERT INTO canvases (id, name) VALUES (?, ?)",
            (id, name)
        )
        await db.commit()

async def get_chat_history(self, session_id: str):
    """Retrieve chat history with message parsing"""
    async with aiosqlite.connect(self.db_path) as db:
        db.row_factory = sqlite3.Row
        cursor = await db.execute(
            "SELECT role, message FROM chat_messages WHERE session_id = ? ORDER BY id ASC",
            (session_id,)
        )
        rows = await cursor.fetchall()
        
        # Parse JSON messages
        messages = []
        for row in rows:
            msg = json.loads(row['message'])
            messages.append(msg)
        return messages
```

---

## 🔄 WebSocket Real-Time Communication

### **Connection Lifecycle**

```python
# services/websocket_router.py

@sio.event
async def connect(sid, environ, auth):
    """Client connects"""
    print(f"Client {sid} connected")
    user_info = auth or {}
    add_connection(sid, user_info)
    
    # Notify client they're connected
    await sio.emit('connected', {'status': 'connected'}, room=sid)

@sio.event
async def disconnect(sid):
    """Client disconnects"""
    print(f"Client {sid} disconnected")
    remove_connection(sid)

@sio.event
async def ping(sid, data):
    """Keepalive ping"""
    await sio.emit('pong', data, room=sid)
```

### **Broadcasting Updates**

```python
# services/websocket_service.py

async def send_to_websocket(session_id: str, event: Dict[str, Any]):
    """Send event to specific session subscribers"""
    socket_ids = get_all_socket_ids()
    
    for socket_id in socket_ids:
        await sio.emit('session_update', {
            'session_id': session_id,
            **event  # type: 'token', type: 'done', etc.
        }, room=socket_id)

# Frontend receives updates
useEffect(() => {
    socket.on('session_update', (data) => {
        if (data.session_id === currentSessionId) {
            if (data.type === 'token') {
                setResponse(prev => prev + data.delta)
            } else if (data.type === 'done') {
                setIsStreaming(false)
            }
        }
    })
}, [socket])
```

---

## 💰 Monetization & Usage Tracking

### **Payment Intent Creation**

```typescript
// frontend - react/src/lib/stripe.ts
export async function createPaymentIntent(amount: number, userId: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    
    const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),  // Convert to cents
        currency: 'usd',
        metadata: { userId }
    })
    
    return intent
}
```

### **Usage Tracking**

```typescript
// Track each generation
export async function trackUsage(userId: string, model: string, count: number) {
    const PRICING = {
        'gpt-4': 0.50,
        'gpt-3.5': 0.10,
        'claude-3': 0.40,
        'flux': 0.05,
        'midjourney': 1.00
    }
    
    const cost = PRICING[model] * count
    
    // Save to database
    await db.create_usage_record({
        userId,
        model,
        count,
        cost,
        timestamp: new Date()
    })
    
    return { userId, model, count, cost }
}
```

---

## 🎨 Frontend Component Architecture

### **Component Hierarchy**

```
App
├── HeroSection
│   ├── Parallax Scroll Effect
│   ├── Animated Gradient Text
│   ├── Staggered Text Animation
│   └── CTA Buttons
│
├── PricingPage
│   ├── Pricing Tiers (3)
│   │   ├── Free ($0)
│   │   ├── Pay-As-You-Go (Most Popular)
│   │   └── Pro Team (Custom)
│   ├── Feature Comparison
│   └── FAQ Section
│
├── ProjectCard (Grid)
│   ├── Image Blur-Up Loading
│   ├── Hover Scale Animation
│   ├── Overlay Text
│   └── View Project Indicator
│
├── ProjectModal
│   ├── Spring Enter Animation
│   ├── Hero Image Carousel
│   ├── Tech Stack Badges
│   ├── "Open Live Site" CTA
│   └── Focus Trap (Accessibility)
│
├── ThemeToggle
│   ├── Sun/Moon Icons
│   └── Animated Switch
│
└── Chat Interface
    ├── Message List
    ├── Tool Execution Indicator
    ├── Streaming Token Display
    └── Cancel Button
```

### **State Management (Zustand)**

```typescript
// Create store
const useStore = create((set) => ({
    // User state
    user: null,
    setUser: (user) => set({ user }),
    
    // Chat state
    messages: [],
    addMessage: (msg) => set(state => ({ 
        messages: [...state.messages, msg] 
    })),
    
    // UI state
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),
    
    // Theme state
    theme: 'dark',
    toggleTheme: () => set(state => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
    }))
}))

// Use in component
const { messages, addMessage } = useStore()
```

---

## 🚀 Deployment: Docker Multi-Stage Build

### **Dockerfile Stages**

```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/react
COPY react/package*.json ./
RUN npm ci
COPY react/ .
RUN npm run build
# Output: /app/react/dist/

# Stage 2: Runtime Backend + Frontend
FROM python:3.12-slim
WORKDIR /app

# Install Python deps
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY server/ ./server/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/react/dist ./react/dist

# Set environment
ENV UI_DIST_DIR=/app/react/dist
ENV HOST=0.0.0.0
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/')" || exit 1

# Start server
CMD ["python", "server/main.py", "--port", "8000"]
```

### **What Gets Built**
```
Stage 1 (18 mins):
  node:20-alpine → npm install → npm run build → dist/ (246 kB gzipped)

Stage 2 (3 mins):
  python:3.12-slim
  + server dependencies (FastAPI, LangGraph, Stripe, etc.)
  + copy built dist/ from Stage 1
  = Single 500MB Docker image
```

---

## 🔐 Security & Authentication

### **Socket.IO Authentication**

```python
# Backend - Validate connection
@sio.event
async def connect(sid, environ, auth):
    """
    auth = {
        'token': 'jwt_token_xyz',
        'user_id': 'user_123'
    }
    """
    # Validate JWT token
    if not validate_jwt(auth.get('token')):
        raise ConnectionRefusedError('Invalid token')
    
    user_info = decode_jwt(auth['token'])
    add_connection(sid, user_info)

# Frontend - Send auth on connect
useEffect(() => {
    socket = io('http://localhost:8000', {
        auth: {
            token: localStorage.getItem('jwt_token'),
            user_id: user.id
        }
    })
    
    socket.connect()
}, [])
```

### **API Middleware**

```python
# Stripe webhook verification
@router.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    # Verify signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return {"error": "Invalid payload"}, 400
    except stripe.error.SignatureVerificationError:
        return {"error": "Invalid signature"}, 400
    
    # Process event
    if event['type'] == 'payment_intent.succeeded':
        amount = event['data']['object']['amount']
        user_id = event['data']['object']['metadata']['user_id']
        
        # Update user balance
        await db_service.add_user_credit(user_id, amount / 100)
    
    return {"status": "ok"}
```

---

## 📊 Performance Optimizations

### **Frontend Optimizations**

```typescript
// 1. Image Blur-Up Loading (LQIP)
<img 
    src={projectImage}
    className={isLoaded ? 'blur-0' : 'blur-lg'}
    onLoad={() => setIsLoaded(true)}
/>

// 2. Code Splitting
const ProjectModal = lazy(() => import('./ProjectModal'))

// 3. Memoization
const ProjectCard = memo(({ project, onClick }) => {
    return (...)
})

// 4. Virtualization for long lists
<FixedSizeList
    height={600}
    itemCount={1000}
    itemSize={50}
>
    {renderItem}
</FixedSizeList>

// 5. Debounced Search
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearch = useMemo(
    () => debounce((query) => performSearch(query), 300),
    []
)
```

### **Backend Optimizations**

```python
# 1. Async/Await (Non-blocking I/O)
async def handle_chat(data):
    # Doesn't block other requests
    await db_service.create_message(...)
    await langgraph_service.process(...)

# 2. Task Cancellation
task = asyncio.create_task(process_chat())
add_stream_task(session_id, task)
# Can cancel: task.cancel()

# 3. Connection Pooling
async with aiosqlite.connect(db_path) as db:
    # Connection reused

# 4. Caching
from functools import lru_cache

@lru_cache(maxsize=128)
def get_model_config(model_name):
    # Cached across requests
    return load_model_config(model_name)
```

---

## 🎯 Request Flow: Complete Example

### **User generates an image**

```
1. FRONTEND
   └─ User types: "Generate a sunset landscape"
   └─ Selects: GPT-4 (text) + Flux (image)
   └─ Clicks: "Generate"

2. HTTP REQUEST
   POST /api/chat
   {
     messages: [{role: 'user', content: 'Generate a sunset...'}],
     session_id: 'sess_xyz',
     text_model: {model: 'gpt-4', provider: 'openai'},
     tool_list: [{model: 'flux', provider: 'comfyui'}]
   }

3. BACKEND PROCESSING
   a) chat_router receives request
   b) chat_service.handle_chat(data)
   c) db_service.create_chat_session(session_id)
   d) db_service.create_message(session_id, 'user', message)
   e) asyncio.create_task(langgraph_multi_agent(...))

4. AI ORCHESTRATION
   a) langgraph_multi_agent creates LLM (ChatOpenAI)
   b) Loads tools (Flux image generation)
   c) Builds agent graph
   d) Runs: agent.stream_events()
   
   Events stream:
   ├─ on_chat_model_stream: "I'll generate a beautiful sunset..."
   ├─ on_tool_start: "Calling Flux..."
   ├─ on_tool_stream: <image generation progress>
   ├─ on_tool_end: "Image generated: https://..."
   └─ on_chat_model_stream: "Here's your sunset image!"

5. REAL-TIME WEBSOCKET UPDATES
   For each event:
   └─ await send_to_websocket(session_id, {
        type: 'token',
        delta: 'word'
      })

6. FRONTEND RECEIVES UPDATES
   socket.on('session_update', (data) => {
     if (data.type === 'token') {
       setOutput(prev => prev + data.delta)
     }
   })

7. DATABASE PERSISTENCE
   └─ db_service.create_message(session_id, 'assistant', full_response)

8. COMPLETION
   └─ send_to_websocket(session_id, { type: 'done' })
   └─ Frontend stops loading spinner
   └─ Display full result with image
```

---

## 🎉 Summary: What Makes It Work

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 19 + Vite | User interface & interactions |
| **State** | Zustand | Client-side state management |
| **Animations** | Framer Motion | Smooth, performant animations |
| **Styling** | Tailwind CSS | Utility-first design system |
| **Backend** | FastAPI | High-performance async API |
| **Real-time** | Socket.IO | WebSocket communication |
| **AI Orchestration** | LangGraph | Multi-agent workflow engine |
| **LLMs** | OpenAI, Anthropic | Language models |
| **Image Gen** | Flux, ComfyUI | Image generation |
| **Database** | SQLite + aiosqlite | Async data persistence |
| **Payments** | Stripe | Payment processing |
| **Containers** | Docker | Production deployment |
| **Reverse Proxy** | Nginx (via Coolify) | Load balancing & SSL |

**Result**: A fully functional, production-ready AI canvas application with real-time streaming, multiple AI providers, payment processing, and beautiful animations! 🚀
