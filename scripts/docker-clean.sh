#!/bin/bash

# VentureCast Docker Cleanup Script
set -e

echo "========================================="
echo "VentureCast Docker Cleanup"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This will remove all VentureCast Docker containers, volumes, and networks${NC}"
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo -e "${YELLOW}Stopping all containers...${NC}"
docker-compose down

echo -e "${YELLOW}Removing volumes...${NC}"
docker-compose down -v

echo -e "${YELLOW}Removing orphaned containers...${NC}"
docker-compose down --remove-orphans

# Optional: Remove images
read -p "Do you also want to remove Docker images? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing images...${NC}"
    docker-compose down --rmi all
fi

# Optional: System prune
read -p "Do you want to run Docker system prune? This will clean up all unused Docker data (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Running system prune...${NC}"
    docker system prune -af --volumes
fi

echo -e "${GREEN}✓ Cleanup complete!${NC}"