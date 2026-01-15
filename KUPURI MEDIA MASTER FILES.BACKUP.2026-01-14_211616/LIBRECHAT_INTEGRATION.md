# 🔗 LibreChat Integration Guide

Complete guide for integrating LibreChat with PAULI Platform.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [LiteLLM Integration](#litellm-integration)
6. [API Integration](#api-integration)
7. [Model Configuration](#model-configuration)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

LibreChat is a self-hosted ChatGPT clone that provides a unified interface for multiple AI models. For PAULI, we integrate it with LiteLLM for centralized model routing and cost optimization.

### Integration Points
- **LiteLLM**: Model routing and API management
- **PAULI Backend**: Custom API endpoints for PAULI-specific features
- **Ask PAULI**: Chat interface through LibreChat
- **Dashboard**: Monitoring and control panel

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Browser                    │
│                        ↓                          │
│               ┌─────────────────────┐              │
│               │  LibreChat (UI) │              │
│               └─────────────────────┘              │
│                        ↓ (API)               │
│               ┌─────────────────────┐              │
│               │  PAULI Backend    │              │
│               │  (FastAPI)        │              │
│               └─────────────────────┘              │
│                        ↓                          │
│               ┌─────────────────────┐              │
│               │  LiteLLM (Router) │              │
│               └─────────────────────┘              │
│                        ↓                          │
│     ┌──────────────────────────────┐          │
│     │  AI Models (OpenAI, Claude) │          │
│     └──────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### 1. Clone LibreChat

```bash
cd pauli-comic-funnel-main
git clone https://github.com/danny-avila/Librechat.git librechat
cd librechat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
# Create .env file in librechat root
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/librechat

# Application
NODE_ENV=development
HOST=localhost
PORT=3080

# CORS (Allow PAULI backend)
CORS_ORIGINS=http://localhost:8000,http://localhost:8080

# Model Configuration
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=your-google-api-key

# LiteLLM Configuration (for model routing)
LITELLM_URL=http://localhost:4000
LITELLM_API_KEY=your-litellm-api-key

# Custom Endpoints
CUSTOM_MODELS=pauli:ask-pauli:|PAULI Avatar
CUSTOM_ENDPOINTS=pauli:ask-pauli:http://localhost:8000/api/ask-pauli
EOF
```

---

## ⚙️ Configuration

### 1. Add PAULI Custom Model

Edit `librechat/lib/db/schema/models.js`:

```javascript
{
  name: 'pauli:ask-pauli',
  id: 'pauli-ask-pauli',
  type: 'custom',
  name: 'PAULI Avatar',
  description: 'Ask PAULI - Conversational AI Avatar',
  maxLength: 8192,
  tokenLimit: 4096,
  imageInput: false,
  vision: false,
  endpoint: '${process.env.PAULI_API_URL || 'http://localhost:8000'}/api/ask-pauli',
  apiKey: '${process.env.INTERNAL_DASHBOARD_API_KEY || 'pauli-secure-key-2024'}',
  requestBodies: {
    'messages': {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            'role': { type: 'string', enum: ['system', 'user', 'assistant'] },
            'content': { type: 'string' }
          },
          required: ['role', 'content']
        }
      },
      role: 'required',
      content: 'required'
    }
  }
}
```

### 2. Configure LiteLLM Routing

Add to `librechat/lib/server/utils/litellm.js`:

```javascript
{
  model_list: [
    'gpt-4-turbo-preview',
    'claude-3-opus-20240229',
    'claude-3-5-sonnet-20240307',
    'pauli:ask-pauli'
  ],
  
  model_group_map: {
    'openai': ['gpt-4-turbo-preview'],
    'anthropic': ['claude-3-opus-20240229', 'claude-3-5-sonnet-20240307'],
    'pauli': ['pauli:ask-pauli']
  },
  
  litellm_params: {
    'model_list': ['gpt-4-turbo-preview', 'claude-3-opus-20240229', 'pauli:ask-pauli'],
    'api_base': process.env.LITELLM_URL || 'http://localhost:4000',
    'api_key': process.env.LITELLM_API_KEY
  }
}
```

### 3. Add PAULI Backend Integration

Create `librechat/app/api/server/routes/pauli.js`:

```javascript
import express from 'express';
import { createChatCompletion } from './utils/litellm';
import { asyncHandler } from './asyncHandler';

const router = express.Router();

// Ask PAULI endpoint
router.post('/ask-pauli', asyncHandler(async (req, res) => {
  const { messages, session_id } = req.body;
  
  // Call PAULI backend
  try {
    const response = await fetch(
      `${process.env.PAULI_API_URL || 'http://localhost:8000'}/api/ask-pauli`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_DASHBOARD_API_KEY || 'pauli-secure-key-2024'}`
        },
        body: JSON.stringify({
          query: messages[messages.length - 1].content,
          conversation_id: session_id
        })
      }
    );
    
    const pauliResponse = await response.json();
    
    // Format for LibreChat
    res.json({
      text: pauliResponse.answer,
      usage: pauliResponse.memory_used,
      model: 'pauli:ask-pauli',
      reasoning_steps: pauliResponse.reasoning_steps
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get PAULI response',
      message: error.message
    });
  }
}));

export default router;
```

---

## 🔌 LiteLLM Integration

### 1. Setup LiteLLM Server

```bash
# In a separate terminal
cd pauli-comic-funnel-main
npm install litellm
```

Create `litellm_config.yaml`:

```yaml
model_list:
  - model_name: gpt-4-turbo-preview
    litellm_params:
      model: gpt-4-turbo-preview
      api_key: os.environ/OPENAI_API_KEY
      api_base: https://api.openai.com/v1
  
  - model_name: claude-3-opus-20240229
    litellm_params:
      model: claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY
      api_base: https://api.anthropic.com/v1
  
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY
      api_base: https://api.openai.com/v1
  
  - model_name: text-embedding-3-small
    litellm_params:
      model: text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY
      api_base: https://api.openai.com/v1
```

### 2. Start LiteLLM

```bash
litellm --config litellm_config.yaml --port 4000
```

LiteLLM will run on: `http://localhost:4000`

---

## 🔌 API Integration

### 1. PAULI Backend Endpoints

#### Ask PAULI
```
POST /api/ask-pauli
Content-Type: application/json
Authorization: Bearer pauli-secure-key-2024

{
  "query": "How do I deploy a React app to Coolify?",
  "conversation_id": "session_abc123"
}

Response:
{
  "session_id": "session_abc123",
  "query": "How do I deploy a React app to Coolify?",
  "answer": "I can help you deploy a React app to Coolify...",
  "timestamp": "2026-01-02T10:30:00Z",
  "reasoning_steps": ["Query analysis", "Memory retrieval", "Response synthesis"],
  "memory_used": {
    "episodic_entries": 15,
    "semantic_entries": 3,
    "procedural_entries": 1
  }
}
```

#### Get PAULI Persona
```
GET /api/pauli/persona
Response:
{
  "name": "PAULI",
  "personality": {
    "humor": 0.3,
    "curiosity": 0.7,
    "helpfulness": 0.9
  },
  "communication_style": {
    "tone": {"polite": 0.7, "confident": 0.5},
    "clarity": 0.8,
    "brevity": 0.4
  },
  "knowledge_count": 250,
  "metadata": {
    "extraction_timestamp": "2026-01-02T10:00:00Z"
  }
}
```

### 2. Memory System API

```
POST /api/pauli/memory/semantic
{
  "content": "React deployment configuration",
  "category": "infrastructure",
  "metadata": {}
}

Response:
{
  "memory_id": "sem_abc123",
  "content": "React deployment configuration",
  "embedding": [0.1, 0.2, 0.3...],
  "category": "infrastructure"
}
```

---

## 🤖 Model Configuration

### Recommended Model Configuration

| Use Case | Model | Reasoning | Cost |
|----------|-------|-----------|-------|
| Quick queries | GPT-4 Turbo | Fast | $0.001/1K tokens |
| Complex reasoning | Claude 3.5 Sonnet | High | $0.003/1K tokens |
| Code generation | Claude 3 Opus | Very High | $0.015/1K tokens |
| Embeddings | text-embedding-3-small | N/A | $0.0001/1K tokens |
| PAULI Avatar | PAULI Custom | Multi-step | Variable |

### LiteLLM Fallback Configuration

```yaml
fallback_models:
  - primary: claude-3-opus-20240229
    fallback: gpt-4-turbo-preview
  
  - primary: claude-3-5-sonnet-20240307
    fallback: gpt-4
```

---

## 🔍 Troubleshooting

### Issue: PAULI Avatar not showing in LibreChat

**Symptom**: PAULI Avatar model not available in model dropdown

**Solution**:
1. Check that PAULI backend is running on port 8000
2. Verify `CUSTOM_MODELS` includes `pauli:ask-pauli`
3. Check LibreChat logs: `npm logs`
4. Test PAULI endpoint directly:
   ```bash
   curl -X POST http://localhost:8000/api/ask-pauli \
     -H "Content-Type: application/json" \
     -d '{"query": "Hello PAULI!"}'
   ```

### Issue: Memory retrieval not working

**Symptom**: PAULI doesn't remember previous conversations

**Solution**:
1. Check that memory system is initialized in PAULI backend
2. Verify episodic memory is being stored
3. Check BigQuery connection (if using cloud storage)
4. Test memory API:
   ```bash
   curl http://localhost:8000/api/pauli/memory/stats
   ```

### Issue: LiteLLM not routing properly

**Symptom**: Requests not reaching correct model

**Solution**:
1. Check LiteLLM server is running: `ps aux | grep litellm`
2. Verify LITELLM_URL in LibreChat .env
3. Check LiteLLM logs: `tail -f /tmp/litellm.log`
4. Test LiteLLM API directly:
   ```bash
   curl -X POST http://localhost:4000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-litellm-api-key" \
     -d '{
       "model": "gpt-4-turbo-preview",
       "messages": [{"role": "user", "content": "Hello"}]
     }'
   ```

---

## 📝 Environment Variables Summary

### LibreChat (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/librechat

# Application
NODE_ENV=development
HOST=localhost
PORT=3080

# CORS
CORS_ORIGINS=http://localhost:8000,http://localhost:8080

# Model APIs
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=your-google-api-key

# LiteLLM
LITELLM_URL=http://localhost:4000
LITELLM_API_KEY=your-litellm-api-key

# PAULI Integration
PAULI_API_URL=http://localhost:8000
INTERNAL_DASHBOARD_API_KEY=pauli-secure-key-2024
```

### PAULI Backend (server/.env)
```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_USERNAME=trevorMoreau13

# Coolify
COOLIFY_API_URL=http://localhost:8000
COOLIFY_TOKEN=your_coolify_token

# LiteLLM
LITELLM_API_URL=http://localhost:4000
LITELLM_API_KEY=your-litellm_api_key
OPENAI_API_KEY=sk-proj-xxxxx

# PAULI Systems
PAULI_OUTPUT_DIR=./pauli_project_analysis
INTERNAL_DASHBOARD_API_KEY=pauli-secure-key-2024
```

---

## 🚀 Quick Start

### 1. Start LiteLLM

```bash
cd pauli-comic-funnel-main
litellm --config litellm_config.yaml --port 4000
```

### 2. Start PAULI Backend

```bash
cd pauli-comic-funnel-main/server
python main.py
```

### 3. Start LibreChat

```bash
cd pauli-comic-funnel-main/librechat
npm start
```

### 4. Access PAULI

Open: `http://localhost:3080`

- Select "PAULI Avatar" from model dropdown
- Ask: "Hello PAULI, what can you help me with?"
- PAULI will respond with its personality and memory

---

## 📊 Monitoring

### PAULI Dashboard

Access: `http://localhost:8000/api/dashboard`

Key metrics:
- **Active Sessions**: Number of active PAULI conversations
- **Memory Usage**: Episodic, semantic, procedural memory entries
- **Token Usage**: Input/output tokens per model
- **Cost Tracking**: Daily/monthly costs
- **Agent Activity**: GitHub scans, PRD generations, deployments

### LibreChat Admin

Access: `http://localhost:3080/admin`

Key metrics:
- **User Activity**: Active users and conversations
- **Model Usage**: Token usage per model
- **API Performance**: Request/response times
- **PAULI Integration**: Custom model call success rate

---

## 🔗 Complete Integration

### Full Stack Running

```
Terminal 1: LiteLLM (Port 4000)
$ litellm --config litellm_config.yaml --port 4000

Terminal 2: PAULI Backend (Port 8000)
$ cd pauli-comic-funnel-main/server
$ python main.py

Terminal 3: LibreChat (Port 3080)
$ cd pauli-comic-funnel-main/librechat
$ npm start

Browser: LibreChat UI
http://localhost:3080
```

### Test Flow

1. **Open LibreChat** at `http://localhost:3080`
2. **Select "PAULI Avatar"** from model dropdown
3. **Ask**: "Hello PAULI, who are you and what can you do?"
4. **PAULI Responds** with personality, memory, and reasoning
5. **Check Dashboard** at `http://localhost:8000/api/dashboard` for metrics

---

## 🎉 Success Criteria

### ✓ Integration Complete When:
- [ ] PAULI Avatar model appears in LibreChat dropdown
- [ ] PAULI responds to queries with its personality
- [ ] PAULI remembers conversation context (episodic memory)
- [ ] PAULI retrieves relevant knowledge (semantic memory)
- [ ] PAULI uses procedural memory for common tasks
- [ ] Dashboard shows real-time metrics
- [ ] Token usage and costs are tracked
- [ ] Multi-agent messages flow through LLM-CL orchestrator

---

**Last Updated**: 2026-01-02

**Status**: ✅ Integration Guide Complete - Ready for Testing