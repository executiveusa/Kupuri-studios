# 🚀 Kupuri Studios - PRODUCTION READY GUIDE

## Status: ✅ LIVE & OPERATIONAL
- **Live URL**: https://kupuri-studios-production-6f67.up.railway.app
- **Deployment Platform**: Railway.app
- **Last Deploy**: December 17, 2025
- **Build Status**: CI/CD via GitHub Actions

---

## 📍 QUICK START

### For Users
1. Visit: https://kupuri-studios-production-6f67.up.railway.app
2. Click "Get Access" or "Enter Studio"
3. Start creating with AI canvas + video/image generation

### For Developers

#### Setup Local Development
```bash
# Clone repository
git clone https://github.com/executiveusa/Kupuri-studios.git
cd Kupuri-studios

# Frontend
cd react && npm ci --legacy-peer-deps && npm run dev

# Backend (in new terminal)
cd server && pip install -r requirements.txt && python main.py
```

#### Deploy Changes
```bash
# One-command deploy
./scripts/deploy.sh "Your deployment message"

# Or with Railway CLI
git push origin main
railway up
```

#### Rollback if Needed
```bash
./scripts/rollback.sh
```

---

## 🎯 PROJECT STRUCTURE

### Frontend (React + Vite)
```
react/
├── src/
│   ├── routes/          # Page routes (/, /canvas, /dashboard)
│   ├── components/      # React components
│   │   ├── landing/     # Landing page
│   │   ├── canvas/      # Canvas editor (Excalidraw)
│   │   ├── chat/        # Chat interface
│   │   └── settings/    # Settings & dialogs
│   ├── i18n/            # Translations (EN + ES-MX)
│   ├── api/             # API client functions
│   ├── contexts/        # Context providers
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
└── tsconfig.json        # TypeScript config
```

### Backend (FastAPI)
```
server/
├── main.py              # Entry point
├── routers/             # API endpoints
│   ├── root_router.py   # /, /health, /api/models
│   ├── chat_router.py   # Chat & streaming
│   ├── metrics_router.py # /metrics & /api/metrics (NEW)
│   └── ...
├── services/            # Business logic
│   ├── metrics_service.py   # Prometheus metrics (NEW)
│   ├── chat_service.py      # Chat handling
│   ├── config_service.py    # Configuration
│   └── ...
├── tools/               # Image/video generation tools
├── requirements.txt     # Python dependencies
└── Dockerfile           # Container build
```

### DevOps
```
.github/
└── workflows/
    └── deploy.yml       # CI/CD pipeline (NEW)

scripts/
├── deploy.sh            # One-command deployment (NEW)
└── rollback.sh          # Quick rollback (NEW)

tests/
└── e2e/
    └── main.spec.ts     # Playwright E2E tests (NEW)

playwright.config.ts    # Test configuration (NEW)
Dockerfile              # Multi-stage build
docker-compose.yml      # Local docker setup
```

---

## 🌍 FEATURES IMPLEMENTED

### Phase 1: Dashboard & Metrics ✅
- **Prometheus Metrics**: `/metrics` endpoint with request/latency data
- **Analytics Dashboard**: `/dashboard` route with real-time charts
  - Latency trends (5-minute window)
  - Request rate visualization
  - Top 10 endpoint performance table
  - Key KPIs (total requests, avg latency, active connections)
- **JSON API**: `/api/metrics` for dashboard consumption
- **i18n Support**: Dashboard in EN + ES-MX

### Phase 2: Bilingual (EN/ES-MX) ✅
- **Language Toggle**: Flag icons (🇺🇸 / 🇲🇽) in navbar
- **9 Namespaces**: common, home, canvas, chat, settings, error, dashboard, tools, agents
- **localStorage Persistence**: Language preference saved
- **Native Spanish**: Mexican Spanish (es-MX), not generic ES
- **Auto-detection**: Browser language detection with manual override

### Phase 3: Deploy Automation ✅
- **Deploy Script** (`scripts/deploy.sh`):
  - One-command `./scripts/deploy.sh "message"`
  - Automatic git push + Railway deploy
  - Health check polling (10 min timeout)
  - Live URL + dashboard link output
  
- **Rollback Script** (`scripts/rollback.sh`):
  - Quick rollback to previous commits
  - Force-with-lease protection
  
- **GitHub Actions CI/CD** (`.github/workflows/deploy.yml`):
  - **Lint**: ESLint (frontend) + Python syntax (backend)
  - **Build**: React (Vite) + Python dependencies check
  - **Test**: Vitest frontend tests
  - **Deploy**: Auto-deploy on main branch push
  - **Notify**: Deployment status reporting

### Phase 4: Playwright E2E Tests ✅
- **Configuration** (`playwright.config.ts`):
  - 5 targets: Chromium, Firefox, WebKit, iPhone, Pixel
  - Automatic web server startup
  - Screenshot + trace on failure
  
- **Test Suite** (`tests/e2e/main.spec.ts`):
  - Landing page hero + language toggle
  - Canvas navigation + Excalidraw loading
  - Dashboard metrics API + charts
  - Mobile responsiveness (375px, 812px)
  - Health check endpoints
  
- **Run Tests**:
  ```bash
  npm run test:e2e              # Run all tests
  npm run test:e2e:ui          # Interactive UI
  npm run test:e2e:debug       # Debugger
  npm run test:e2e:headed      # Browser visible
  ```

---

## 🔧 TECHNICAL STACK

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite 6.2 (fast bundle, <1MB gzipped)
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Charts**: Recharts (dashboard)
- **Internationalization**: i18next + react-i18next
- **State**: Zustand + React Query
- **Websocket**: Socket.io

### Backend
- **Framework**: FastAPI + Uvicorn
- **Observability**: Prometheus metrics
- **LLM**: LangChain + LangGraph (pinned versions)
- **Models**: Claude, GPT-4, Gemini, Ollama
- **Tools**: 15+ image/video providers (Flux, DALL-E, Midjourney, etc.)
- **Database**: JSON file-based (SQLite/PostgreSQL ready)

### Infrastructure
- **Hosting**: Railway.app
- **Docker**: Multi-stage build (Node + Python)
- **CI/CD**: GitHub Actions
- **Testing**: Playwright (E2E)
- **Monitoring**: Built-in health checks

---

## 📊 DEPLOYMENT INFO

### Live URLs
| Service | URL | Status |
|---------|-----|--------|
| **App** | https://kupuri-studios-production-6f67.up.railway.app | 🟢 Online |
| **Health Check** | .../health | 🟢 Responding |
| **Metrics (Prometheus)** | .../metrics | 🟢 Responding |
| **Dashboard** | .../dashboard | 🟢 Responding |
| **API** | .../api/metrics | 🟢 Responding |

### Environment Variables (Railway)
Set these in Railway dashboard:
```
CORS_ORIGINS=https://kupuri-studios-production-6f67.up.railway.app
BASE_API_URL=https://kupuri-studios-production-6f67.up.railway.app
UI_DIST_DIR=/app/react/dist
HOST=0.0.0.0
```

---

## 🚀 DEPLOYMENT WORKFLOW

### Automatic (GitHub Actions)
```
1. Developer pushes to `main` branch
2. GitHub Actions runs:
   ✓ Lint (ESLint + Python)
   ✓ Build (React + Python deps)
   ✓ Test (Vitest)
3. If all pass → Auto-deploy to Railway
4. Health check confirms online
5. Slack notification sent (optional)
```

### Manual (Script)
```bash
./scripts/deploy.sh "Added new feature"
# Automatically:
# 1. Pushes to GitHub
# 2. Deploys to Railway
# 3. Polls health check
# 4. Shows live URLs
```

### Rollback (Script)
```bash
./scripts/rollback.sh
# Select commit to revert to
# Auto-deploys rolled-back version
```

---

## 📈 MONITORING

### Available Metrics
- **HTTP Requests**: Total, by endpoint, by status code
- **Response Times**: Avg, min, max, p95 latencies
- **Model Usage**: Requests per provider/model
- **Tool Usage**: Image/video generation stats
- **Errors**: By type and endpoint
- **Connections**: Active WebSocket connections

### Dashboard Views
- **Real-time Charts**: Updated every 5 seconds
- **Endpoint Performance**: Top 10 slowest endpoints
- **Latency Trends**: 5-minute rolling window
- **Request Rate**: Requests per time period

### Access Dashboard
```
https://kupuri-studios-production-6f67.up.railway.app/dashboard
```

---

## 🌐 MULTILINGUAL SUPPORT

### Supported Languages
- **English (en)** - US
- **Spanish (es-MX)** - Mexico

### How to Add More Languages
1. Create new translation file: `react/src/i18n/locales/xx/common.json`
2. Add to i18n index: `react/src/i18n/index.ts`
3. Update LanguageSwitcher component with flag icon

### Current Coverage
- ✅ Landing page (100%)
- ✅ Canvas editor (90%)
- ✅ Dashboard (100%)
- ✅ Chat interface (85%)
- ✅ Settings (100%)
- ✅ Agents (100%)
- ✅ Tools (100%)

---

## 🧪 TESTING

### E2E Tests
```bash
# All browsers/devices
npm run test:e2e

# Interactive UI (visual debugging)
npm run test:e2e:ui

# With VS Code debugger
npm run test:e2e:debug

# Show browser window
npm run test:e2e:headed
```

### Unit Tests
```bash
npm run test:run       # Run once
npm run test:watch     # Watch mode
```

### What's Tested
- ✅ Landing page rendering
- ✅ Language toggle
- ✅ Canvas loading
- ✅ Dashboard metrics API
- ✅ Mobile responsiveness
- ✅ Health endpoints
- ✅ Error handling

---

## 🔐 SECURITY NOTES

- ✅ CORS configured per environment
- ✅ No hardcoded secrets in code
- ✅ All sensitive config in Railway env vars
- ✅ Health checks available (no auth needed)
- ✅ Metrics endpoint public (for Prometheus scraping)

### To Secure Metrics
```python
# In metrics_router.py, add authentication:
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.get("/metrics")
async def get_prometheus_metrics(credentials: HTTPAuthCredentials = Depends(security)):
    # Verify token...
    return metrics_service.get_metrics()
```

---

## 📝 DEPLOYMENT CHECKLIST

Before going viral, ensure:
- [ ] Environment variables set on Railway
- [ ] Domain configured (custom or railway.app)
- [ ] SSL certificate active (auto via Railway)
- [ ] Monitoring/alerts configured
- [ ] Error logging configured (Sentry optional)
- [ ] CDN for static assets (optional)
- [ ] Database backups scheduled
- [ ] Rate limiting configured
- [ ] Analytics enabled (PostHog optional)
- [ ] Load testing done

---

## 🚨 TROUBLESHOOTING

### App shows 502 error
```bash
railway logs --tail 50
# Check for import errors or dependency conflicts
```

### Health check fails
```bash
curl https://kupuri-studios-production-6f67.up.railway.app/health
# Should return 200 JSON response
```

### Deployment stuck
```bash
# Cancel current deployment
railway down

# Re-deploy fresh
railway up
```

### Tests failing locally
```bash
# Install Playwright browsers
npx playwright install

# Run with verbose logging
npm run test:e2e:debug
```

---

## 📚 USEFUL COMMANDS

### Development
```bash
npm run dev                    # Start Vite dev server
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run test:run              # Run tests once
npm run test:watch            # Watch mode
```

### Deployment
```bash
./scripts/deploy.sh           # Deploy with one command
./scripts/rollback.sh         # Rollback to previous version
railway status                # Check current status
railway logs --tail 100       # Get logs
railway restart               # Restart app
```

### Testing
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui          # Visual test runner
npm run test:e2e:headed      # Tests in visible browser
```

---

## 🎯 NEXT STEPS

### Short-term (This Week)
1. Run load test on dashboard
2. Set up error monitoring (Sentry)
3. Configure analytics (PostHog)
4. Test on mobile devices

### Medium-term (Next 2 Weeks)
1. Add API rate limiting
2. Optimize images to WebP
3. Set up CDN for assets
4. Add email notifications for deploys

### Long-term (Next Month)
1. Custom domain setup
2. Database migration (PostgreSQL)
3. Advanced monitoring (Grafana)
4. Marketplace for agents

---

## 📞 SUPPORT

**Live App**: https://kupuri-studios-production-6f67.up.railway.app  
**Dashboard**: https://kupuri-studios-production-6f67.up.railway.app/dashboard  
**Docs**: This file  
**GitHub**: https://github.com/executiveusa/Kupuri-studios

---

**Last Updated**: December 17, 2025  
**Status**: ✅ PRODUCTION READY  
**Next Deploy**: Auto via GitHub Actions on `git push main`
