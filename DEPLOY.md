# Kupuri Studios - Coolify Deployment Guide
# ==========================================

## Prerequisites

Before deploying to Coolify on your Hostinger VPS:

1. **Coolify installed** on your VPS
2. **Domain configured** (e.g., kupuri.studio)
3. **SSH access** to your server

## Quick Start

### 1. Push to Git Repository

```bash
git add .
git commit -m "MVP ready for deployment"
git push origin main
```

### 2. Configure Coolify

1. Log into Coolify dashboard
2. Create new project "Kupuri Studios"
3. Add service → Docker Compose
4. Connect your Git repository
5. Set docker-compose file to `docker-compose.prod.yml`

### 3. Environment Variables

Add these in Coolify's environment settings:

```
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
POSTGRES_PASSWORD=secure_password_here
LITELLM_MASTER_KEY=sk-kupuri-litellm

# API Services
HEYGEN_API_KEY=...
ELEVENLABS_API_KEY=...

# URLs (Coolify sets these automatically)
API_URL=https://api.kupuri.studio
FRONTEND_URL=https://kupuri.studio
```

### 4. Domain Configuration

In Coolify, configure domains:
- **Frontend**: kupuri.studio → Port 3000
- **API**: api.kupuri.studio → Port 8000

Coolify handles SSL certificates automatically via Let's Encrypt.

### 5. Deploy

Click "Deploy" in Coolify. First deployment takes ~5-10 minutes.

## Post-Deployment Checklist

- [ ] API health check: `curl https://api.kupuri.studio/health`
- [ ] Frontend loads: https://kupuri.studio
- [ ] Stripe webhook configured in Stripe Dashboard
- [ ] Test video generation pipeline
- [ ] Test Stripe checkout flow

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.kupuri.studio/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook secret to Coolify env as `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Check logs
```bash
# SSH into server
ssh user@your-vps-ip

# View logs
docker logs kupuri-api
docker logs kupuri-frontend
docker logs kupuri-litellm
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml restart api
```

### Database issues
```bash
# Access PostgreSQL
docker exec -it kupuri-db psql -U postgres -d kupuri
```

## Monitoring

### Health Endpoints
- API: https://api.kupuri.studio/health
- Video: https://api.kupuri.studio/api/video/health
- Payments: https://api.kupuri.studio/api/payments/health

### Logs
Monitor in Coolify dashboard or via SSH:
```bash
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## Scaling (Future)

When you need to scale:
1. Increase VPS resources on Hostinger
2. Add more API workers in docker-compose.prod.yml
3. Consider dedicated LiteLLM instance
4. Add Redis cluster for caching

## Cost Estimation

| Service | Monthly Cost |
|---------|--------------|
| Hostinger VPS (KVM 2) | ~$10-15 |
| Domain | ~$12/year |
| OpenAI API | ~$20-50 |
| Anthropic API | ~$10-30 |
| HeyGen | ~$24 (Creator plan) |
| ElevenLabs | ~$22 (Creator plan) |
| Stripe | 2.9% + $0.30/transaction |
| **Total** | **~$100-150/month** |

With $99/month subscriptions, you're profitable at 2 paying customers.
