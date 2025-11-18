#!/bin/bash

# VentureCast Docker Setup Script
set -e

echo "========================================="
echo "VentureCast Docker Setup"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running!${NC}"
    echo "Please start Docker Desktop or Docker daemon"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if backend .env file exists
if [ ! -f VentureCast_Backend-main/.env ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found${NC}"
    echo -e "${YELLOW}Creating a basic .env file for backend...${NC}"
    cat > VentureCast_Backend-main/.env << EOF
# Backend Environment Variables
PORT=3001
SESSION_SECRET=change-this-secret-in-production
STRIPE_SECRET_KEY=your-stripe-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
EOF
    echo -e "${GREEN}✓ Backend .env created - please update with your actual API keys${NC}"
else
    echo -e "${GREEN}✓ Backend .env exists${NC}"
fi

# Ask if user wants to build images
echo ""
read -p "Do you want to build Docker images now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose build
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
fi

# Ask if user wants to start services
echo ""
read -p "Do you want to start the services now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Services started successfully${NC}"

    echo ""
    echo "========================================="
    echo "Services are running at:"
    echo "  Frontend (Metro): http://localhost:8081"
    echo "  Backend API: http://localhost:3001"
    echo "  MongoDB: localhost:27017"
    echo "  Redis: localhost:6379"
    echo "========================================="
    echo ""
    echo "Useful commands:"
    echo "  make logs          - View all logs"
    echo "  make logs-backend  - View backend logs"
    echo "  make logs-frontend - View frontend logs"
    echo "  make down          - Stop all services"
    echo "  make restart       - Restart all services"
    echo "  make help          - Show all available commands"
fi

echo -e "${GREEN}Setup complete!${NC}"