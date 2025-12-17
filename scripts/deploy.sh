#!/bin/bash
# Deploy script for Kupuri Studios
# Pushes code to Railway and monitors deployment

set -e

echo "🚀 Kupuri Studios Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Install from: https://railway.app/cli${NC}"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found${NC}"
    exit 1
fi

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  You are on branch '$BRANCH', not 'main'${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Uncommitted changes detected. Commit or stash them first.${NC}"
    exit 1
fi

# Get deployment message
if [ -z "$1" ]; then
    DEPLOY_MSG="Deploy $(date +%Y-%m-%d\ %H:%M:%S)"
else
    DEPLOY_MSG="$1"
fi

echo -e "${YELLOW}📝 Deployment Message: $DEPLOY_MSG${NC}"

# Push to git
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin main

# Deploy to Railway
echo -e "${YELLOW}🚄 Deploying to Railway...${NC}"
railway up

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Waiting for deployment to complete (checking every 10s)...${NC}"
MAX_WAIT=600  # 10 minutes
ELAPSED=0
INTERVAL=10

while [ $ELAPSED -lt $MAX_WAIT ]; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null https://kupuri-studios-production-6f67.up.railway.app/health)
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Deployment successful! App is online.${NC}"
        
        # Show deployment info
        echo ""
        echo -e "${GREEN}📊 Deployment Summary:${NC}"
        railway status
        echo ""
        echo -e "${GREEN}🌐 Live URL: https://kupuri-studios-production-6f67.up.railway.app${NC}"
        echo -e "${GREEN}📈 Metrics: https://kupuri-studios-production-6f67.up.railway.app/metrics${NC}"
        echo -e "${GREEN}📊 Dashboard: https://kupuri-studios-production-6f67.up.railway.app/dashboard${NC}"
        exit 0
    fi
    
    echo "Status: HTTP $RESPONSE (waited ${ELAPSED}s)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

echo -e "${RED}❌ Deployment timeout. Check Railway dashboard for details.${NC}"
railway logs --tail 50
exit 1
