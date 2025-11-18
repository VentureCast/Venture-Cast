# VentureCast Docker Management Makefile

.PHONY: help build up down restart logs shell clean test

# Default target
help:
	@echo "VentureCast Docker Commands:"
	@echo "  make build          - Build all Docker images"
	@echo "  make build-prod     - Build production Docker images"
	@echo "  make up             - Start all services in development mode"
	@echo "  make up-prod        - Start all services in production mode"
	@echo "  make down           - Stop and remove all containers"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make logs-backend   - View backend logs"
	@echo "  make logs-frontend  - View frontend logs"
	@echo "  make shell-backend  - Open shell in backend container"
	@echo "  make shell-frontend - Open shell in frontend container"
	@echo "  make shell-mongo    - Open MongoDB shell"
	@echo "  make clean          - Remove all containers, networks, and volumes"
	@echo "  make test           - Run tests in containers"
	@echo "  make test-docker    - Test Docker setup and services"
	@echo "  make init           - Initialize project (copy env files, install deps)"

# Initialize project
init:
	@echo "Initializing VentureCast Docker environment..."
	@if [ ! -f VentureCast_Backend-main/.env ]; then \
		echo "Creating backend .env file..."; \
		echo "PORT=3001" > VentureCast_Backend-main/.env; \
		echo "SESSION_SECRET=change-this-in-production" >> VentureCast_Backend-main/.env; \
		echo "Backend .env created - please update with your API keys"; \
	else \
		echo "Backend .env already exists"; \
	fi
	@echo "Initialization complete!"

# Build commands
build:
	docker-compose build

build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start/Stop commands
up:
	docker-compose up -d
	@echo "Services started! Access at:"
	@echo "  - Frontend: http://localhost:8081"
	@echo "  - Backend API: http://localhost:3001"
	@echo "  - MongoDB: localhost:27017"
	@echo "  - Redis: localhost:6379"

up-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d

down:
	docker-compose down

restart:
	docker-compose restart

# Logging commands
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-mongo:
	docker-compose logs -f mongodb

# Shell access
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-mongo:
	docker-compose exec mongodb mongosh -u admin -p password

# Database commands
db-backup:
	@echo "Backing up MongoDB..."
	docker-compose exec -T mongodb mongodump --uri="mongodb://admin:password@localhost:27017" --out=/data/backup
	docker cp venturecast-mongodb:/data/backup ./backup-$(shell date +%Y%m%d-%H%M%S)
	@echo "Backup complete!"

db-restore:
	@echo "Restoring MongoDB from backup..."
	@read -p "Enter backup directory name: " dir; \
	docker cp $$dir venturecast-mongodb:/data/restore; \
	docker-compose exec mongodb mongorestore --uri="mongodb://admin:password@localhost:27017" /data/restore

# Cleanup commands
clean:
	docker-compose down -v
	docker system prune -af
	@echo "All containers, volumes, and images removed!"

clean-volumes:
	docker-compose down -v
	@echo "Volumes removed!"

# Testing
test:
	@echo "Running backend tests..."
	docker-compose exec backend npm test
	@echo "Running frontend tests..."
	docker-compose exec frontend yarn test

# Test Docker setup
test-docker:
	@./scripts/test-docker.sh

# Development helpers
dev-backend:
	docker-compose up backend mongodb redis

dev-frontend:
	docker-compose up frontend

# Production deployment
deploy:
	@echo "Building production images..."
	$(MAKE) build-prod
	@echo "Starting production services..."
	$(MAKE) up-prod
	@echo "Production deployment complete!"

# Health checks
health:
	@echo "Checking service health..."
	@docker-compose ps
	@echo "\nBackend health:"
	@curl -f http://localhost:3001/ || echo "Backend not responding"
	@echo "\nFrontend health:"
	@curl -f http://localhost:8081/status || echo "Frontend not responding"
	@echo "\nMongoDB health:"
	@docker-compose exec mongodb mongosh --eval "db.runCommand('ping')" || echo "MongoDB not responding"

# Install dependencies without Docker (for local development)
install-local:
	cd VentureCast_Backend-main && npm install
	cd VentureCast_Frontend-main && yarn install