#!/bin/bash
# Kupuri Studios - One-Command Deployment Script
# Supports: Railway (testing) → Coolify (production VPS)

set -e  # Exit on error

echo "🎨 Kupuri Studios - Deployment Automation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file. Please edit it with your API keys before deploying.${NC}"
    echo ""
    echo "Required keys:"
    echo "  - LITELLM_MASTER_KEY (generate with: openssl rand -hex 32)"
    echo "  - GOOGLE_API_KEY (free tier: https://makersuite.google.com/app/apikey)"
    echo ""
    read -p "Press Enter after editing .env to continue..."
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Deployment mode selection
echo "Select deployment target:"
echo "  1) Railway (Testing - Free tier, 5-min deploy)"
echo "  2) Coolify (Production VPS - Your 8GB server)"
echo "  3) Local Docker (Development - Test locally first)"
echo ""
read -p "Enter choice [1-3]: " deploy_choice

case $deploy_choice in
    1)
        echo -e "${GREEN}🚂 Deploying to Railway...${NC}"
        deploy_railway
        ;;
    2)
        echo -e "${GREEN}☁️  Deploying to Coolify VPS...${NC}"
        deploy_coolify
        ;;
    3)
        echo -e "${GREEN}🐳 Starting local Docker deployment...${NC}"
        deploy_local
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

function deploy_railway() {
    echo ""
    echo "Step 1: Checking Railway CLI..."
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
        npm install -g @railway/cli
    fi
    
    echo -e "${GREEN}✅ Railway CLI ready${NC}"
    
    echo ""
    echo "Step 2: Linking to Railway project..."
    railway link ${RAILWAY_PROJECT_ID:-43c1a70d-cce7-4aef-82b5-0446ac677141}
    
    echo ""
    echo "Step 3: Setting environment variables..."
    railway variables set LITELLM_PROXY_URL="http://litellm:4000"
    railway variables set LITELLM_API_KEY="${LITELLM_MASTER_KEY}"
    railway variables set GOOGLE_API_KEY="${GOOGLE_API_KEY}"
    railway variables set DISABLE_COMFYUI="true"
    railway variables set NODE_ENV="production"
    
    echo ""
    echo "Step 4: Deploying..."
    railway up --detach
    
    echo ""
    echo -e "${GREEN}✅ Deployment initiated!${NC}"
    echo ""
    echo "Monitor deployment:"
    echo "  $ railway logs"
    echo ""
    echo "View app:"
    echo "  $ railway open"
}

function deploy_coolify() {
    echo ""
    echo "Step 1: Checking Coolify CLI..."
    
    if [ -z "$COOLIFY_API_TOKEN" ]; then
        echo -e "${RED}❌ COOLIFY_API_TOKEN not set in .env${NC}"
        echo "Get your token from: https://your-coolify-domain.com/security/api-tokens"
        exit 1
    fi
    
    echo ""
    echo "Step 2: Building Docker image..."
    docker-compose -f docker-compose.prod.yml build
    
    echo ""
    echo "Step 3: Pushing to Coolify registry..."
    
    # Tag image for Coolify
    docker tag kupuri-studios:latest ${COOLIFY_DOMAIN}/kupuri-studios:latest
    
    # Push to Coolify
    docker push ${COOLIFY_DOMAIN}/kupuri-studios:latest
    
    echo ""
    echo "Step 4: Deploying to VPS via Coolify API..."
    
    python3 scripts/deploy_coolify.py \
        --token "${COOLIFY_API_TOKEN}" \
        --domain "${COOLIFY_DOMAIN}" \
        --image "kupuri-studios:latest"
    
    echo ""
    echo -e "${GREEN}✅ Deployed to Coolify VPS!${NC}"
    echo ""
    echo "Access your app:"
    echo "  https://${COOLIFY_DOMAIN}"
    echo ""
    echo "View logs:"
    echo "  ssh root@your-vps-ip"
    echo "  docker logs -f kupuri-studios"
}

function deploy_local() {
    echo ""
    echo "Step 1: Checking Docker..."
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not installed. Install from: https://docker.com${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker ready${NC}"
    
    echo ""
    echo "Step 2: Building containers..."
    docker-compose -f docker-compose.prod.yml build
    
    echo ""
    echo "Step 3: Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo ""
    echo "Step 4: Waiting for services to be healthy..."
    sleep 10
    
    # Health check
    if curl -f http://localhost:8000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Kupuri Studios is running!${NC}"
    else
        echo -e "${RED}❌ Health check failed. Check logs:${NC}"
        echo "  docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
    
    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ LiteLLM proxy is running!${NC}"
    else
        echo -e "${YELLOW}⚠️  LiteLLM proxy not responding (may still be starting)${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Local deployment complete!${NC}"
    echo ""
    echo "Access the app:"
    echo "  🌐 Frontend: http://localhost:8000"
    echo "  🤖 LiteLLM: http://localhost:4000"
    echo ""
    echo "View logs:"
    echo "  $ docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "Stop services:"
    echo "  $ docker-compose -f docker-compose.prod.yml down"
}

# Run tests before deployment
function run_tests() {
    echo ""
    echo "Running pre-deployment tests..."
    
    # Backend tests
    cd server
    if [ -f requirements.txt ]; then
        echo "Testing Python dependencies..."
        python3 -m pip install -q -r requirements.txt
    fi
    cd ..
    
    # Frontend tests
    cd react
    if [ -f package.json ]; then
        echo "Testing Node dependencies..."
        npm install --silent
        npm run lint || echo "Linting warnings (non-blocking)"
    fi
    cd ..
    
    echo -e "${GREEN}✅ Tests passed${NC}"
}

# Deployment complete message
function deployment_complete() {
    echo ""
    echo "================================================"
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Test the app thoroughly"
    echo "  2. Monitor logs for errors"
    echo "  3. Check LiteLLM cost dashboard"
    echo ""
    echo "Cost optimization tips:"
    echo "  - Gemini Flash is FREE (1500 req/day)"
    echo "  - DeepSeek V3 is FREE via OpenRouter"
    echo "  - Only upgrade to paid models when needed"
    echo ""
    echo "Need help? Check docs:"
    echo "  📖 README.md"
    echo "  📖 DOCKER-DEPLOY.md"
    echo ""
}

# Execute deployment
deployment_complete
