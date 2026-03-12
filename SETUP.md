# KUPURI Studios - Setup & Deployment Guide

## Overview
KUPURI Studios is a monorepo containing:
- **BFF** (Backend-for-Frontend): Hono.js + TypeScript running on port 8000
- **Web**: Next.js frontend running on port 3000
- **Database**: PostgreSQL for persistent storage
- **Services**: Stripe, Gemini, Anthropic Claude, Polygon NFTs, Print-on-Demand

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- npm or pnpm
- PostgreSQL 12+
- Environment variables from `.env.example`

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your actual values:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: Random string for JWT signing
# - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: From Stripe dashboard
# - ANTHROPIC_API_KEY: From Anthropic console
# - GEMINI_API_KEY: From Google AI Studio
```

### 2. Install Dependencies
```bash
# Install BFF dependencies
cd bff
npm install
cd ..

# Install Web dependencies
cd web
npm install
cd ..
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb kupuri

# Run migrations (if using drizzle-kit)
cd bff
npm run db:migrate
cd ..
```

### 4. Start Services (Development)
```bash
# Terminal 1: Start BFF
cd bff
npm run dev

# Terminal 2: Start Web (Next.js)
cd web
npm run dev

# Terminal 3: Verify database is running
psql postgresql://kupuri:kupuri@localhost:5432/kupuri
```

Access:
- Web: http://localhost:3000
- BFF API: http://localhost:8000/api
- API Docs: http://localhost:8000/api/health

## Docker Deployment (Production)

### Prerequisites
- Docker & Docker Compose
- Environment file (.env)

### 1. Prepare Environment
```bash
cp .env.example .env

# Edit .env with production values:
DB_PASSWORD=your_strong_password_here
JWT_SECRET=your_random_jwt_secret
STRIPE_SECRET_KEY=sk_...
# ... other secrets
```

### 2. Build & Run
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify services
curl http://localhost:8000/api/health
curl http://localhost:3000
```

### 3. Database Initialization
```bash
# Run migrations inside container
docker-compose exec bff npm run db:migrate

# Or access database directly
docker-compose exec postgres psql -U kupuri -d kupuri
```

### 4. Stop Services
```bash
docker-compose down

# Stop and remove data
docker-compose down -v
```

## API Endpoints

### Public Routes
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login & get JWT
- `GET /api/health` - Health check

### Protected Routes (require JWT token)
- `GET /api/comics` - List user's comics
- `POST /api/comics` - Create new comic
- `POST /api/comics/:id/generate` - Generate AI story
- `POST /api/stripe/checkout` - Create Stripe session
- `POST /api/tokens/balance` - Get token balance
- `POST /api/nft/mint` - Mint character/comic as NFT

## Architecture

### BFF (Backend-for-Frontend)
- **Framework**: Hono (lightweight, fast)
- **Database**: Drizzle ORM + PostgreSQL
- **Authentication**: JWT with HS256
- **Services**:
  - Vault: Encrypted API key storage
  - Brain: LLM routing (Claude → Gemini → Grok)
  - Conductor: Comic generation orchestration
  - Diplomat: API adapters (Stripe, Polygon, Printful)

### Agents
- **StoryPlannerAgent**: CYOA narrative generation
- **CharacterKeeperAgent**: Character consistency & NFT metadata
- **PanelRendererAgent**: Story → manga panels
- **ExportHandlerAgent**: Multi-format export (PDF, EPUB, Kindle, CBR)
- **PODOrchestratorAgent**: Printful order management

### Web (Next.js)
- **Pages**: Landing, auth, dashboard, create, preview, checkout
- **State Management**: Zustand stores
- **Styling**: TailwindCSS + shadcn/ui
- **Authentication**: localStorage JWT + useAuth hook

## Token Economy

### Packages
1. **Starter**: 1,100 tokens (10% bonus)
2. **Creator**: 6,000 tokens (20% bonus)
3. **Pro**: 20,250 tokens (35% bonus)
4. **Studio**: 75,000 tokens (50% bonus)

### Token Costs
- Comic generation: 150 tokens
- Panel rendering: 100 tokens
- PDF export: 50 tokens

### Bonuses
- Sign-up: 1,100 tokens (free)
- Daily login: 10 tokens
- Referral: 100 tokens per friend

## Stripe Integration

### Setup
1. Create Stripe account
2. Create 4 products in Stripe dashboard
3. Copy price IDs to environment variables:
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_CREATOR`
   - `STRIPE_PRICE_PRO`
   - `STRIPE_PRICE_STUDIO`
4. Set webhook endpoint to `/api/stripe/webhook`

### Testing
```bash
# Use Stripe test card
4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
```

## Monitoring & Logs

### Docker Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f bff
docker-compose logs -f web
docker-compose logs -f postgres
```

### Health Checks
```bash
# BFF health
curl http://localhost:8000/api/health

# Database connection test
docker-compose exec postgres pg_isready -U kupuri
```

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database service
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
# Modify port mappings like: "9000:8000"

# Or kill processes on ports
lsof -i :8000  # Find PID
kill -9 <PID>
```

### JWT Token Expired
- Tokens expire after 24 hours
- User must re-login to get new token
- Token stored in localStorage, cleared on logout

### Stripe Webhook Not Working
```bash
# Forward Stripe events during development
stripe listen --forward-to localhost:8000/api/stripe/webhook

# Use generated webhook signing secret in .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deployment Platforms

### Vercel (Frontend)
```bash
# Push web/ directory to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

### Railway/Heroku (Backend)
```bash
# Connect repository to Railway
# Set environment variables
# Deploy automatically on push
```

### Docker Registry
```bash
# Build and push to registry
docker build -t your-registry/kupuri-studios .
docker push your-registry/kupuri-studios

# Pull and run
docker pull your-registry/kupuri-studios
docker run -p 8000:8000 -p 3000:3000 your-registry/kupuri-studios
```

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Change database password
- [ ] Set secure CORS origins
- [ ] Use HTTPS in production
- [ ] Rotate API keys regularly
- [ ] Enable database backups
- [ ] Set resource limits in Docker
- [ ] Use secrets management (AWS Secrets, Vault, etc)
- [ ] Enable rate limiting on API
- [ ] Set up monitoring/alerting

## Development Workflow

### Adding a New API Route
1. Create route in `bff/src/routes/`
2. Import in `bff/src/index.ts`
3. Register with `app.route()`
4. Test with `curl` or Postman

### Adding a New Component
1. Create in `web/src/components/`
2. Import in page file
3. Use hooks: `useAuth()`, `useComic()`, `useTokens()`
4. Test in browser

### Database Changes
1. Update schema in `bff/src/db/schema.ts`
2. Create migration (if using drizzle-kit)
3. Test locally before deployment

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Check database connectivity
4. Review error messages in browser console
5. Look at BFF server logs

---

**Version**: 1.0.0
**Last Updated**: March 2026
