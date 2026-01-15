# 🚀 Kupuri Studios - LiteLLM Integration Guide

## Quick Start (5 Minutes)

### 1. Get Your Free API Key
```bash
# Google Gemini (FREE: 1500 req/day, 1M tokens/day)
# Visit: https://makersuite.google.com/app/apikey
```

### 2. Set Up Environment
```bash
# Copy template
cp .env.example .env

# Edit .env and add:
GOOGLE_API_KEY=your_key_here
LITELLM_MASTER_KEY=$(openssl rand -hex 32)
```

### 3. Deploy

#### Option A: Test Locally (Recommended First)
```bash
chmod +x deploy.sh
./deploy.sh
# Choose option 3 (Local Docker)
# Access: http://localhost:8000
```

#### Option B: Deploy to Railway (Testing)
```bash
./deploy.sh
# Choose option 1 (Railway)
# Automatic deployment to cloud
```

#### Option C: Deploy to Coolify VPS (Production)
```bash
# Set Coolify token in .env first
./deploy.sh
# Choose option 2 (Coolify)
```

---

## Architecture Overview

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ HTTP/WebSocket
┌────────▼────────────────────────┐
│   Kupuri Studios (Port 8000)    │
│   - FastAPI Backend             │
│   - React Frontend              │
│   - Agent/Canvas/Chat           │
└────────┬────────────────────────┘
         │ HTTP
┌────────▼────────────────────────┐
│   LiteLLM Proxy (Port 4000)     │
│   - Model Router                │
│   - Cost Tracking               │
│   - Fallback Logic              │
└────────┬────────────────────────┘
         │
    ┌────┴─────┬─────────┬──────────┐
    │          │         │          │
┌───▼───┐  ┌──▼──┐  ┌───▼────┐  ┌──▼────┐
│Gemini │  │ GPT │  │ Claude │  │  GLM  │
│(FREE) │  │ 4o  │  │Sonnet 4│  │  4V   │
└───────┘  └─────┘  └────────┘  └───────┘
```

---

## Cost Optimization (How We Save 70-90%)

### Default Routing Strategy

1. **Free Tier First** (Priority 1)
   - Gemini 2.0 Flash (FREE: 1500 req/day)
   - DeepSeek V3 Free (via OpenRouter)
   - Used for: Draft generation, simple tasks

2. **Vision Tasks** (Upgrade when needed)
   - GLM-4V Plus ($0.005/1K tokens)
   - GPT-4o (fallback for complex vision)
   - Used for: Image analysis, storyboarding

3. **Premium** (Only when required)
   - Claude Sonnet 4 (advanced reasoning)
   - GPT-4o Mini (fast + cheap)
   - Used for: Final outputs, complex logic

### Cost Tracking Dashboard

Access at: `http://localhost:8000/settings` → Usage tab

Shows:
- Total requests by model
- Cost breakdown
- Savings from free tier
- Budget alerts

---

## API Endpoints

### LiteLLM Management
```bash
# List available models
GET /api/litellm/models

# Get usage stats
GET /api/litellm/usage?days=7

# Update routing policy
POST /api/litellm/optimize-routing
{
  "enable_free_tier": true,
  "upgrade_for_vision": true,
  "budget_limit_monthly": 50.00
}

# Health check
GET /api/litellm/health
```

---

## Environment Variables

### Required
```bash
LITELLM_MASTER_KEY=<generate with: openssl rand -hex 32>
GOOGLE_API_KEY=<get from Google AI Studio>
```

### Optional (Add for more models)
```bash
OPENAI_API_KEY=<OpenAI key>
ANTHROPIC_API_KEY=<Anthropic key>
ZHIPU_API_KEY=<Zhipu/GLM key>
OPENROUTER_API_KEY=<OpenRouter key>
```

### VPS Optimization
```bash
DISABLE_COMFYUI=true  # Saves ~2GB RAM
```

---

## White-Label Customization

Update in `.env`:
```bash
VITE_BRAND_NAME="Your Studio Name"
VITE_LOGO_URL="https://yourdomain.com/logo.png"
VITE_PRIMARY_COLOR="#6366f1"
```

Restart app to apply changes.

---

## Troubleshooting

### LiteLLM not starting
```bash
# Check logs
docker logs kupuri-litellm

# Verify config
cat litellm_config.yaml
```

### Models not appearing
```bash
# Test LiteLLM health
curl http://localhost:4000/health

# List models directly
curl http://localhost:4000/models \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

### High costs
```bash
# Check usage
curl http://localhost:8000/api/litellm/usage

# Enable free-tier routing
curl -X POST http://localhost:8000/api/litellm/optimize-routing \
  -H "Content-Type: application/json" \
  -d '{"enable_free_tier": true}'
```

---

## Production Checklist

- [ ] Set strong `LITELLM_MASTER_KEY` (not default)
- [ ] Add at least one API key (Google recommended)
- [ ] Test locally before deploying
- [ ] Set CORS_ORIGINS for your domain
- [ ] Enable HTTPS (via Coolify/Railway)
- [ ] Set budget limits in LiteLLM config
- [ ] Monitor usage dashboard daily

---

## Scaling Tips

### 8GB VPS (Current Setup)
- ✅ Can handle: 10-50 concurrent users
- ✅ Disable ComfyUI (saves 2GB RAM)
- ✅ Use external model APIs (no local models)

### 16GB VPS (If Growing)
- Add Redis for caching (reduces API calls)
- Enable ComfyUI for local image generation
- Run multiple replicas for high availability

### Enterprise (32GB+)
- Full ComfyUI with custom workflows
- Local Ollama models (privacy)
- Multi-region deployment

---

## Support

- 📖 Full docs: `README.md`
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Join community]
- 📧 Email: support@kupuristudios.com

---

**Built with**: FastAPI • React • LiteLLM • Docker  
**Optimized for**: Cost savings • Mexico City market • Creative workflows
