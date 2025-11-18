# VentureCast Docker Setup Guide

## Overview

This project is fully dockerized for easy development and deployment. Docker handles all dependencies including Node.js, MongoDB, Redis, and ensures consistent environments across all machines.

## Prerequisites

- Docker Desktop (Mac/Windows) or Docker Engine (Linux)
- Docker Compose v2.0 or higher
- Make (optional, for using Makefile commands)

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd Venture-Cast

# Run the setup script
./scripts/docker-setup.sh

# Or manually:
# 1. Ensure backend .env exists with your API keys
# 2. Build and start all services
docker-compose up -d
```

### 2. Access Services

Once running, services are available at:

- **Frontend (React Native Metro)**: http://localhost:8081
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Nginx (production only)**: http://localhost:80

## Docker Architecture

### Services

1. **mongodb**: MongoDB database (port 27017)
2. **backend**: Express.js API server (port 3001)
3. **frontend**: React Native Metro bundler (port 8081)
4. **redis**: Redis cache for sessions (port 6379)
5. **nginx**: Reverse proxy (production only, port 80)

### Networks

- `venturecast-network`: Bridge network connecting all services

### Volumes

- `mongodb_data`: Persistent MongoDB data
- `mongodb_config`: MongoDB configuration
- `redis_data`: Redis persistent data

## Development Workflow

### Using Make Commands

```bash
# Start all services
make up

# View logs
make logs
make logs-backend
make logs-frontend

# Access container shells
make shell-backend
make shell-frontend
make shell-mongo

# Restart services
make restart

# Stop services
make down

# Clean everything (including volumes)
make clean
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build
docker-compose up -d
```

### Hot Reload

Both frontend and backend support hot reload in development:

- **Backend**: Uses `nodemon` to watch for file changes
- **Frontend**: Metro bundler automatically detects changes

## Environment Variables

The Docker setup uses your existing backend `.env` file directly - no additional Docker environment files needed!

### Backend Application: `VentureCast_Backend-main/.env`

Your existing backend `.env` file with all API keys:

```env
PORT=3001
SESSION_SECRET=your_session_secret
STRIPE_SECRET_KEY=your_stripe_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
```

**Note**: Docker automatically:
- Loads your backend's existing `.env` file
- Overrides the MongoDB URI to connect to the Docker MongoDB container
- No duplicate configuration needed!

## Mobile App Development

### iOS Development

```bash
# Start Metro bundler in Docker
docker-compose up frontend

# In another terminal, run iOS app locally
cd VentureCast_Frontend-main
npx react-native run-ios
```

### Android Development

```bash
# Start Metro bundler in Docker
docker-compose up frontend

# Configure Android to connect to Docker Metro bundler
# In VentureCast_Frontend-main/android/app/src/debug/res/xml/network_security_config.xml
# Add your Docker host IP

# Run Android app
cd VentureCast_Frontend-main
npx react-native run-android
```

## Production Deployment

### Build Production Images

```bash
# Using Make
make build-prod
make up-prod

# Or using docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Considerations

1. **Security**:
   - Update all passwords in `.env.docker`
   - Use secrets management for sensitive data
   - Enable HTTPS in nginx configuration

2. **Performance**:
   - Adjust MongoDB memory limits
   - Configure Redis maxmemory policy
   - Set appropriate Node.js memory limits

3. **Monitoring**:
   - Set up health checks
   - Configure logging aggregation
   - Monitor container resource usage

## Database Management

### Backup MongoDB

```bash
# Using Make
make db-backup

# Manual backup
docker-compose exec mongodb mongodump --uri="mongodb://admin:password@localhost:27017" --out=/backup
docker cp venturecast-mongodb:/backup ./backup-$(date +%Y%m%d)
```

### Restore MongoDB

```bash
# Using Make
make db-restore

# Manual restore
docker cp ./backup venturecast-mongodb:/restore
docker-compose exec mongodb mongorestore --uri="mongodb://admin:password@localhost:27017" /restore
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Find process using port
   lsof -i :3001
   # Kill process or change port in docker-compose.yml
   ```

2. **MongoDB connection failed**:
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   # Ensure MongoDB is healthy
   docker-compose ps
   ```

3. **Metro bundler not accessible**:
   ```bash
   # Check if container is running
   docker-compose ps frontend
   # Check logs
   docker-compose logs frontend
   ```

4. **Permission errors**:
   ```bash
   # Fix volume permissions
   docker-compose exec backend chown -R node:node /app
   ```

### Reset Everything

```bash
# Complete cleanup
make clean

# Or manually
docker-compose down -v
docker system prune -af
```

## Adding New Dependencies

### Backend Dependencies

```bash
# Option 1: Add to container and update package.json
docker-compose exec backend npm install <package>
docker cp venturecast-backend:/app/package.json ./VentureCast_Backend-main/

# Option 2: Update locally and rebuild
cd VentureCast_Backend-main
npm install <package>
docker-compose build backend
docker-compose up -d backend
```

### Frontend Dependencies

```bash
# Option 1: Add to container
docker-compose exec frontend yarn add <package>
docker cp venturecast-frontend:/app/package.json ./VentureCast_Frontend-main/

# Option 2: Update locally and rebuild
cd VentureCast_Frontend-main
yarn add <package>
docker-compose build frontend
docker-compose up -d frontend
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker CI

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: docker-compose build
      - name: Run tests
        run: |
          docker-compose up -d
          docker-compose exec -T backend npm test
          docker-compose exec -T frontend yarn test
```

## Performance Optimization

### Image Size Optimization

- Multi-stage builds are used for production
- Alpine Linux base images for smaller size
- Only production dependencies in final image

### Build Cache Optimization

- `.dockerignore` files exclude unnecessary files
- Layer caching optimized in Dockerfiles
- Volume mounts used for development hot-reload

## Security Best Practices

1. **Non-root users**: Containers run as non-root users
2. **Secret management**: Never commit `.env` files
3. **Network isolation**: Services communicate through internal network
4. **Health checks**: All services have health check endpoints
5. **Resource limits**: Set in production docker-compose

## Support

For issues or questions:
1. Check logs: `make logs`
2. Verify service health: `make health`
3. Review this documentation
4. Check Docker Desktop resources (memory/CPU)

## License

See LICENSE file in project root.