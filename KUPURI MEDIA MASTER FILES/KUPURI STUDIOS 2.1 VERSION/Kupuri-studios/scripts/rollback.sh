#!/bin/bash
# Rollback script for Kupuri Studios
# Reverts to previous commit and deploys

set -e

echo "⏮️  Kupuri Studios Rollback Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found.${NC}"
    exit 1
fi

# Show recent commits
echo -e "${YELLOW}📜 Recent commits:${NC}"
git log --oneline -10

# Get commit to rollback to
read -p "Enter commit hash to rollback to (or press Enter for HEAD~1): " COMMIT
if [ -z "$COMMIT" ]; then
    COMMIT="HEAD~1"
fi

# Confirm rollback
echo -e "${YELLOW}⚠️  This will revert to commit: $COMMIT${NC}"
read -p "Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

# Reset to commit
echo -e "${YELLOW}🔙 Resetting to $COMMIT...${NC}"
git reset --hard $COMMIT
git push origin main --force-with-lease

# Deploy
echo -e "${YELLOW}🚄 Deploying rolled-back version...${NC}"
railway up

echo -e "${GREEN}✅ Rollback complete!${NC}"
railway logs --tail 20
