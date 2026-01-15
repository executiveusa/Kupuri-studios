# 🏗️ TECHNICAL ARCHITECTURE SUMMARY

**Kupuri Studios Production v1.0**  
**Updated**: December 17, 2025  
**Status**: Live on Railway.app

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                      │
│                     (Railway.app Container)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               FASTAPI BACKEND (Port 8000)             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │      REQUEST MIDDLEWARE STACK               │    │   │
│  │  ├─────────────────────────────────────────────┤    │   │
│  │  │  1. CORS Handler                            │    │   │
│  │  │  2. Metrics Middleware (NEW)                │    │   │
│  │  │     - Record request start/end              │    │   │
│  │  │     - Calculate latency                     │    │   │
│  │  │     - Track errors                          │    │   │
│  │  │  3. Authentication (if configured)          │    │   │
│  │  │  4. Request Router                          │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         API ROUTERS                         │    │   │
│  │  ├─────────────────────────────────────────────┤    │   │
│  │  │  • root_router.py   (/, /health, /api)    │    │   │
│  │  │  • chat_router.py   (/chat, /models)      │    │   │
│  │  │  • metrics_router.py (/metrics) [NEW]     │    │   │
│  │  │  • ...other routers                        │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         SERVICE LAYER                      │    │   │
│  │  ├─────────────────────────────────────────────┤    │   │
│  │  │  • MetricsService (NEW) - Prometheus       │    │   │
│  │  │  • ChatService - LLM handling              │    │   │
│  │  │  • ConfigService - Settings                │    │   │
│  │  │  • ToolService - Gen tools                 │    │   │
│  │  │  • ModelService - Model routing            │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           EXTERNAL INTEGRATIONS                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • Claude API (Anthropic)                            │   │
│  │  • GPT-4 / GPT-4V (OpenAI)                           │   │
│  │  • Gemini (Google)                                   │   │
│  │  • Flux / DALL-E (Image Gen)                         │   │
│  │  • Midjourney (via API)                              │   │
│  │  • Ollamá (Local inference)                          │   │
│  │  • WebSocket client connections                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ HTTP / WebSocket            │ Prometheus Scrape
         │                              │
┌────────▼──────────────────────────────▼──────────────┐
│            REACT FRONTEND (Vite Build)               │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │      PAGE ROUTES                               │ │
│  ├────────────────────────────────────────────────┤ │
│  │  • / (Landing)        - Hero, CTAs             │ │
│  │  • /canvas (Editor)   - Excalidraw + Chat     │ │
│  │  • /dashboard (NEW)   - Analytics              │ │
│  │  • /agents (Studio)   - Agent builder          │ │
│  │  • /settings (Config) - User preferences       │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │      COMPONENT TREE                            │ │
│  ├────────────────────────────────────────────────┤ │
│  │                                                 │ │
│  │  App                                           │ │
│  │   ├─ LanguageSwitcher [🇺🇸 / 🇲🇽]        │ │
│  │   ├─ Navbar                                   │ │
│  │   ├─ Routes                                   │ │
│  │   │   ├─ Landing                              │ │
│  │   │   │   └─ Hero + CTA Buttons               │ │
│  │   │   ├─ Canvas                               │ │
│  │   │   │   ├─ Excalidraw Editor                │ │
│  │   │   │   └─ Chat Panel                       │ │
│  │   │   ├─ Dashboard [NEW]                      │ │
│  │   │   │   ├─ MetricCard × 4                   │ │
│  │   │   │   ├─ LatencyTrendChart                │ │
│  │   │   │   ├─ RequestRateChart                 │ │
│  │   │   │   └─ PerformanceTable                 │ │
│  │   │   └─ ...other routes                      │ │
│  │   └─ Footer                                   │ │
│  │                                                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │      STATE MANAGEMENT                         │ │
│  ├────────────────────────────────────────────────┤ │
│  │  • Zustand (app state)                        │ │
│  │  • React Query (API caching)                  │ │
│  │  • Context API (i18n)                         │ │
│  │  • localStorage (persistence)                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │      i18n SYSTEM [NEW]                        │ │
│  ├────────────────────────────────────────────────┤ │
│  │  Languages: EN (us) + ES (mx)                 │ │
│  │  Namespaces: 8 (common, home, canvas, etc)   │ │
│  │  Persistence: localStorage (key: lng)        │ │
│  │  Detection: browser → localStorage → default │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
         │
         │ HTTP GET/POST
         │ WebSocket
         │
```

---

## CODE LAYER BREAKDOWN

### Backend: MetricsService Architecture
```python
MetricsService (server/services/metrics_service.py)
│
├── Prometheus Metrics
│   ├── Counter: http_requests_total (by endpoint, status)
│   ├── Histogram: http_request_duration_seconds
│   ├── Counter: model_requests_total (by model)
│   ├── Counter: tool_requests_total (by tool)
│   ├── Counter: errors_total (by type, endpoint)
│   ├── Gauge: active_connections
│   └── Gauge: last_request_timestamp
│
├── In-Memory State (Aggregation)
│   ├── endpoint_stats: dict[endpoint] → {requests, latency_ms, errors}
│   └── timeline_data: deque[last 300 entries]
│
├── Public Methods
│   ├── record_request_start(request_id) → None
│   ├── record_request_end(request_id, method, endpoint, status_code) → None
│   ├── record_error(error_type, endpoint) → None
│   ├── record_model_request(model_name) → None
│   ├── record_tool_request(tool_name) → None
│   ├── get_summary() → dict {total_requests, avg_latency, endpoints, ...}
│   └── generate_latest() → str (Prometheus format)
│
└── Endpoint: /metrics → generate_latest()
└── Endpoint: /api/metrics → get_summary() (JSON)
```

### Middleware Integration (main.py)
```python
@app.middleware("http")
async def metrics_middleware(request: Request, call_next: Callable):
    """
    Wraps every HTTP request with metric recording
    
    1. Record request_id + start_time
    2. Execute route handler (call_next)
    3. Record end_time + status_code
    4. Calculate duration
    5. Call metrics_service.record_request_end()
    6. Return response
    """
```

### Frontend: Dashboard Component Architecture
```typescript
Dashboard (/react/src/routes/dashboard.tsx)
│
├── State
│   ├── metrics: MetricsData (from API)
│   ├── loading: boolean
│   ├── error: string | null
│   └── refreshInterval: 5000ms
│
├── Effects
│   ├── useEffect → fetchMetrics() every 5 seconds
│   └── useEffect → cleanup on unmount
│
├── Render Structure
│   ├── Header
│   │   └─ Title + i18n labels
│   │
│   ├── KPI Cards (Grid)
│   │   ├─ MetricCard[totalRequests]
│   │   ├─ MetricCard[avgLatency]
│   │   ├─ MetricCard[activeConnections]
│   │   └─ MetricCard[uniqueEndpoints]
│   │
│   ├── Charts (Row 1)
│   │   ├─ LineChart (latency trends)
│   │   └─ BarChart (request rate)
│   │
│   └── Performance Table (Scrollable)
│       ├─ Columns: Endpoint, Requests, Avg Latency, Status
│       ├─ Rows: Top 10 endpoints
│       └─ Sortable headers
│
└── API Calls
    ├── GET /api/metrics → every 5 seconds
    └── Error handling → show error UI
```

### i18n Integration
```typescript
i18n Config (react/src/i18n/index.ts)
│
├── Instance Creation
│   ├── i18next.init({
│   │   lng: 'en',                  // default
│   │   fallbackLng: 'en',
│   │   ns: ['common', 'dashboard', ...],
│   │   resources: { en: {...}, es-MX: {...} }
│   │ })
│   └── .use(LanguageDetector)
│
├── Language Detection Priority
│   1. localStorage.getItem('lng')
│   2. navigator.language (browser)
│   3. htmlTag lang attribute
│   4. fallback: 'en'
│
├── Namespaces (8 total)
│   ├── common     - Shared: button labels, common phrases
│   ├── home       - Landing page
│   ├── canvas     - Canvas editor
│   ├── chat       - Chat interface
│   ├── settings   - Settings panel
│   ├── error      - Error messages
│   ├── dashboard  - Analytics [NEW]
│   ├── tools      - Tool descriptions
│   └── agents     - Agent studio
│
└── Usage in Components
    ├── const { t } = useTranslation('dashboard')
    ├── t('totalRequests')  // → "Total Requests" or "Solicitudes Totales"
    └── i18n.changeLanguage('es-MX') // → switch language
```

---

## DEPLOYMENT PIPELINE

### GitHub Actions Workflow (.github/workflows/deploy.yml)
```
Trigger: git push origin main
│
├─ Lint Stage
│  ├─ ESLint (React)
│  ├─ Python syntax (flake8)
│  └─ continue-on-error: true (non-blocking)
│
├─ Build Stage
│  ├─ React Build (Vite)
│  │  └─ Output: react/dist/
│  ├─ Python Requirements Check
│  │  └─ Verify pip install succeeds
│  └─ Upload artifact: react/dist/
│
├─ Test Stage
│  └─ Vitest (unit tests)
│     └─ continue-on-error: true
│
├─ Deploy Stage
│  ├─ Install Railway CLI
│  ├─ railway up (deploy to production)
│  └─ 5-minute health check polling
│     ├─ curl /health
│     ├─ retry every 10s
│     └─ fail if 200 not received
│
└─ Notify Stage
   └─ Send Slack/Discord message with status
```

### Deploy Script (scripts/deploy.sh)
```bash
./scripts/deploy.sh "Deploy message"
│
├─ Pre-flight Checks
│  ├─ Branch == main
│  └─ No uncommitted changes
│
├─ Deploy Steps
│  ├─ git push origin main
│  ├─ railway up
│  └─ Poll health check
│     ├─ 600 seconds max (10 minutes)
│     ├─ 10-second intervals
│     └─ Exit code 0 on success
│
└─ Output
   ├─ Live URL
   ├─ Deployment time
   └─ Health check results
```

---

## METRICS DATA FLOW

```
HTTP Request
    │
    ├─ Enter Request
    │  └─ metrics_middleware (start)
    │     └─ metrics_service.record_request_start(request_id)
    │        └─ store: request_id → {start_time, endpoint}
    │
    ├─ Process Request
    │  └─ route handler executes
    │
    └─ Exit Request
       └─ metrics_middleware (end)
          └─ metrics_service.record_request_end(
                request_id, 
                method, 
                endpoint, 
                status_code
             )
             ├─ calculate duration
             ├─ http_requests_total.inc()
             ├─ http_request_duration_seconds.observe(duration)
             └─ update endpoint_stats[endpoint]
```

### Metrics Exposed
```
Prometheus Format (/metrics)
│
├─ # HELP http_requests_total Total HTTP requests
│  # TYPE http_requests_total counter
│  http_requests_total{endpoint="/canvas",status="200"} 1234
│  http_requests_total{endpoint="/api/chat",status="200"} 5678
│  http_requests_total{endpoint="/metrics",status="200"} 999
│
├─ # HELP http_request_duration_seconds Request latency
│  # TYPE http_request_duration_seconds histogram
│  http_request_duration_seconds_bucket{le="0.1",endpoint="/canvas"} 1100
│  http_request_duration_seconds_bucket{le="0.5",endpoint="/canvas"} 1200
│  http_request_duration_seconds_bucket{le="+Inf",endpoint="/canvas"} 1234
│  http_request_duration_seconds_sum{endpoint="/canvas"} 250.5
│  http_request_duration_seconds_count{endpoint="/canvas"} 1234
│
└─ JSON Format (/api/metrics)
   {
     "total_requests": 8145,
     "avg_latency_ms": 245,
     "active_connections": 12,
     "unique_endpoints": 8,
     "endpoint_stats": {
       "/canvas": {"requests": 1234, "avg_latency": 300},
       "/api/chat": {"requests": 5678, "avg_latency": 150}
     }
   }
```

---

## E2E TEST ARCHITECTURE

### Playwright Configuration (playwright.config.ts)
```typescript
defineConfig({
  testDir: './tests/e2e',
  
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] }
  ],
  
  webServer: {
    command: 'npm run dev',   // Vite on :5174
    port: 5174,
    reuseExistingServer: true
  },
  
  reporter: 'html'  // HTML report on failure
})
```

### Test Coverage (tests/e2e/main.spec.ts)
```
Feature: Landing Page
  ✓ Page loads successfully
  ✓ Hero section is visible
  ✓ Language toggle appears
  ✓ Language switch to Spanish works

Feature: Canvas Editor
  ✓ Navigation to /canvas succeeds
  ✓ Excalidraw initializes

Feature: Dashboard
  ✓ Dashboard route loads
  ✓ Metrics API responds
  ✓ Charts render with data

Feature: Mobile Responsiveness
  ✓ Viewport meta tag present
  ✓ Hamburger menu responsive

Feature: API Health
  ✓ /health endpoint returns 200
  ✓ /metrics endpoint responds

Total: 13 tests × 5 browsers = 65 test runs
```

---

## KEY FILES REFERENCE

| File | Lines | Purpose |
|------|-------|---------|
| `server/services/metrics_service.py` | 225 | Prometheus metrics collection |
| `server/routers/metrics_router.py` | 35 | Metrics endpoints |
| `react/src/routes/dashboard.tsx` | 280 | Analytics dashboard UI |
| `react/src/i18n/index.ts` | ~100 | i18n configuration |
| `.github/workflows/deploy.yml` | 150 | CI/CD pipeline |
| `scripts/deploy.sh` | 80 | Deploy automation |
| `tests/e2e/main.spec.ts` | 180+ | E2E tests |
| `playwright.config.ts` | 40 | Test runner config |
| `server/main.py` | +20 lines | Metrics middleware |

---

## MONITORING CHECKLIST

### Validate After Deployment
- [ ] `/health` returns 200 OK
- [ ] `/api/metrics` returns valid JSON
- [ ] `/metrics` returns Prometheus format
- [ ] Dashboard loads at `/dashboard`
- [ ] Language toggle works (EN ↔ ES-MX)
- [ ] All 4 KPI cards display numbers
- [ ] Charts render with data points
- [ ] Top 10 endpoints table shows data
- [ ] Mobile viewport is responsive
- [ ] E2E tests pass: `npm run test:e2e`

---

## PERFORMANCE CONSIDERATIONS

### Metrics Overhead
- Middleware adds ~1-2ms per request
- In-memory storage only (no database)
- Garbage collection of old entries (300-entry deque)
- Prometheus scrape compatible with all tools

### Frontend Optimization
- Dashboard polling: 5-second intervals (configurable)
- Charts use Recharts (optimized rendering)
- Lazy loading for route components
- Image optimization via Docker build

### Deployment Strategy
- Docker multi-stage build (reduces image size)
- Cache buster for fresh builds when needed
- Health check before marking as online
- Automatic rollback on failure (scripted)

---

**Last Updated**: December 17, 2025  
**Architecture Version**: 1.0 Production Ready  
**Deployment**: Railway.app Container  
**Status**: Live
