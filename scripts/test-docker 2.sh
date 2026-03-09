#!/bin/bash

# VentureCast Docker Test Script
set -e

echo "========================================="
echo "Testing VentureCast Docker Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_service() {
    local service=$1
    local url=$2
    local name=$3

    echo -n "Testing $name... "
    if curl -f -s -o /dev/null "$url"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Check if containers are running
echo "1. Checking if all containers are running..."
echo "-------------------------------------------"
docker-compose ps
echo ""

# Test Backend
echo "2. Testing Backend API..."
echo "-------------------------------------------"
if curl -f -s http://localhost:3001/ > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    echo "Backend Response:"
    curl -s http://localhost:3001/
    echo ""
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "Backend Logs:"
    docker-compose logs --tail=20 backend
fi
echo ""

# Test Frontend Metro Bundler
echo "3. Testing Frontend Metro Bundler..."
echo "-------------------------------------------"
if curl -f -s http://localhost:8081/status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Metro Bundler is running${NC}"
else
    echo -e "${YELLOW}⚠ Metro Bundler may still be starting up${NC}"
    echo "Note: Metro bundler can take 30-60 seconds to fully start"
fi
echo ""

# Test MongoDB
echo "4. Testing MongoDB..."
echo "-------------------------------------------"
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
    echo "Database Info:"
    docker-compose exec -T mongodb mongosh --quiet --eval "
        print('MongoDB Version: ' + db.version());
        print('Databases: ' + db.getMongo().getDBNames().join(', '));
    "
else
    echo -e "${RED}✗ MongoDB is not responding${NC}"
fi
echo ""

# Test Redis
echo "5. Testing Redis..."
echo "-------------------------------------------"
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
    REDIS_RESPONSE=$(docker-compose exec -T redis redis-cli ping)
    echo "Redis Response: $REDIS_RESPONSE"
else
    echo -e "${RED}✗ Redis is not responding${NC}"
fi
echo ""

# Test Backend Environment Variables
echo "6. Testing Backend Environment..."
echo "-------------------------------------------"
echo "Environment Variables Loaded:"
docker-compose exec -T backend sh -c 'echo "PORT: $PORT"'
docker-compose exec -T backend sh -c 'echo "NODE_ENV: $NODE_ENV"'
docker-compose exec -T backend sh -c 'echo "MONGODB_URI: ${MONGODB_URI:0:30}..."'
echo ""

# Test MongoDB Connection from Backend
echo "7. Testing Backend → MongoDB Connection..."
echo "-------------------------------------------"
if docker-compose exec -T backend node -e "
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/venture-cast-backend')
        .then(() => { console.log('Connection successful'); process.exit(0); })
        .catch(err => { console.error('Connection failed:', err.message); process.exit(1); });
" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend can connect to MongoDB${NC}"
else
    echo -e "${RED}✗ Backend cannot connect to MongoDB${NC}"
fi
echo ""

# Check Container Health
echo "8. Container Health Status..."
echo "-------------------------------------------"
docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Resource Usage
echo "9. Resource Usage..."
echo "-------------------------------------------"
echo "Container Resource Stats:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""

# Count services
TOTAL_SERVICES=4
RUNNING_SERVICES=$(docker-compose ps --services --filter "status=running" | wc -l)

echo "Services Running: $RUNNING_SERVICES/$TOTAL_SERVICES"
echo ""

if [ "$RUNNING_SERVICES" -eq "$TOTAL_SERVICES" ]; then
    echo -e "${GREEN}✓ All services are running successfully!${NC}"
    echo ""
    echo "Access Points:"
    echo "  - Backend API: http://localhost:3001"
    echo "  - Frontend Metro: http://localhost:8081"
    echo "  - MongoDB: localhost:27017"
    echo "  - Redis: localhost:6379"
else
    echo -e "${RED}✗ Some services are not running${NC}"
    echo ""
    echo "Run these commands to debug:"
    echo "  docker-compose logs backend"
    echo "  docker-compose logs frontend"
    echo "  docker-compose logs mongodb"
    echo "  docker-compose ps"
fi

echo ""
echo "========================================="
echo "For more detailed logs, run:"
echo "  docker-compose logs -f"
echo "========================================="