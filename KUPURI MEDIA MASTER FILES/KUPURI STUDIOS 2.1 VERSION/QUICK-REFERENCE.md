# 🎯 QUICK REFERENCE CARD

## Live URLs
```
🌍 App:       https://kupuri-studios-production-6f67.up.railway.app
📊 Dashboard: https://kupuri-studios-production-6f67.up.railway.app/dashboard
🏥 Health:    https://kupuri-studios-production-6f67.up.railway.app/health
📈 Metrics:   https://kupuri-studios-production-6f67.up.railway.app/metrics
📡 API:       https://kupuri-studios-production-6f67.up.railway.app/api/metrics
```

## Deploy Commands
```bash
# Deploy with script (recommended)
./scripts/deploy.sh "Your message"

# Deploy manually
git push origin main

# Rollback
./scripts/rollback.sh

# Check status
railway status
```

## Test Commands
```bash
# Run all E2E tests
npm run test:e2e

# Visual debugging
npm run test:e2e:ui

# VS Code debugger
npm run test:e2e:debug

# Visible browsers
npm run test:e2e:headed
```

## Verify Endpoints
```bash
# Health check
curl https://kupuri-studios-production-6f67.up.railway.app/health

# Metrics (JSON)
curl https://kupuri-studios-production-6f67.up.railway.app/api/metrics

# Prometheus format
curl https://kupuri-studios-production-6f67.up.railway.app/metrics
```

## Documentation
- **PRODUCTION_GUIDE.md** - Complete user guide
- **TECHNICAL-ARCHITECTURE.md** - System design
- **DEPLOYMENT-COMPLETE.md** - Deployment details
- **EXECUTIVE-HANDOFF.md** - One-page summary

## Features Live
✅ Real-time analytics dashboard  
✅ English + Spanish (Mexico) support  
✅ Health checks + metrics endpoints  
✅ E2E test suite (13+ tests × 5 browsers)  
✅ One-command deployment automation  

## Support
- GitHub: https://github.com/executiveusa/Kupuri-studios
- Logs: `railway logs --tail 50`
- Dashboard: https://railway.app

---

**Status**: ✅ Production Ready | 🟡 Building (5-10 min)  
**Date**: Dec 17, 2025
