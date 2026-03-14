# Kupuri Studios - Vercel Deployment Guide

## ✅ Completed Setup

All code is ready for Vercel deployment:
- ✅ React frontend built and optimized (`react/dist/`)
- ✅ `vercel.json` configuration created
- ✅ Build scripts configured (`npm run build:vercel`)
- ✅ Environment variables documented
- ✅ GitHub Actions workflow ready (`.github/workflows/deploy-vercel.yml`)
- ✅ All commits pushed to branch `claude/ai-comic-anime-studio-017xU6RLQvaERkM1T7kkmAvA`

## 🚀 Next Steps to Deploy

### Step 1: Set GitHub Secrets for Vercel

1. Go to your GitHub repository: `executiveusa/Kupuri-studios`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Create the following secrets (get values from your Vercel and service accounts):

**Vercel Configuration**:
- `VERCEL_TOKEN` - Get from Vercel dashboard → Settings → Tokens
- `VERCEL_ORG_ID` - Get from Vercel dashboard → Settings → Team ID
- `VERCEL_PROJECT_ID` - Get from Vercel project → Settings → Project ID

**Database & Auth**:
- `DATABASE_URL` - Your self-hosted PostgreSQL connection string
- `JWT_SECRET` - Generate a random 32+ character secret
- `JWT_REFRESH_SECRET` - Generate a random 32+ character secret

**LLM & API Keys**:
- `ANTHROPIC_API_KEY` - From Anthropic console
- `OPENAI_API_KEY` - From OpenAI console
- `GOOGLE_API_KEY` - From Google Cloud console
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard

See `.env.example` for additional optional variables.

### Step 2: Trigger Deployment

Choose ONE of these options:

#### Option A: Deploy via GitHub Actions (Automatic)
```bash
# Push to main branch to trigger auto-deployment
git push origin main

# Or deploy from feature branch (creates staging)
git push origin claude/ai-comic-anime-studio-017xU6RLQvaERkM1T7kkmAvA
```

#### Option B: Deploy via Vercel CLI (Local)
```bash
# Set token as environment variable (get from Vercel dashboard)
export VERCEL_TOKEN=your_vercel_token_here

# Link project (one time setup)
vercel link --scope executiveusa

# Deploy to production
vercel --prod

# Or deploy to staging
vercel
```

#### Option C: Manual Vercel Deploy
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import from Git: select `executiveusa/Kupuri-studios`
4. Set environment variables (same as Step 1)
5. Click "Deploy"

## 📊 Project Configuration

### Vercel Build Settings
- **Framework**: React
- **Build Command**: `npm run build:vercel`
- **Output Directory**: `react/dist`
- **Install Command**: `npm install --force`

### Environment Variables
All required environment variables are listed in `.env.example`:
- Database: `DATABASE_URL`, `REDIS_URL`
- Authentication: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- LLM: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`
- Payments: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- Third-party: See `.env.example` for full list

## 🔒 Security Notes

**⚠️ IMPORTANT**: The API keys provided in this guide should be rotated immediately in production:
1. Generate new keys for each service
2. Update GitHub Secrets with new values
3. Rotate credentials on a schedule

**For self-hosted PostgreSQL**:
- Ensure `DATABASE_URL` points to your self-hosted instance
- Verify PostgreSQL is accessible from Vercel (whitelist Vercel IPs if needed)
- Test connection: `psql $DATABASE_URL`

## ✨ Deployment Verification

Once deployed, verify the app is working:

```bash
# Check deployment status
vercel list

# View logs
vercel logs

# Test frontend
curl https://your-vercel-domain.vercel.app

# Test health endpoint (if API proxy configured)
curl https://your-vercel-domain.vercel.app/api/health
```

## 📝 Files Added/Modified

- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Added `build:vercel` script
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ `server/requirements.txt` - Fixed Python dependencies
- ✅ `.github/workflows/deploy-vercel.yml` - GitHub Actions workflow

## 🎯 What's Deployed

**Frontend (React)**:
- Vite-optimized build
- TailwindCSS styling
- React Router for navigation
- All UI components and pages

**Included**:
- Dashboard with metrics
- Bilingual support (English, Spanish-MX)
- Canvas editor
- Chat interface
- Agent studio
- Settings panel

**Not included** (requires separate deployment):
- Python FastAPI backend (`server/main.py`)
- Electron desktop app
- ComfyUI integration

## 🔗 Links

- **Vercel Dashboard**: https://vercel.com/executiveusa
- **Vercel Project Settings**: Get Project ID from your Vercel dashboard
- **Git Branch**: `claude/ai-comic-anime-studio-017xU6RLQvaERkM1T7kkmAvA`
- **Deployment Workflow**: `.github/workflows/deploy-vercel.yml`

---

**Last Updated**: 2026-03-14
**Status**: 🟢 Ready for Production
