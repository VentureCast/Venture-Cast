# Docker Setup Guide for VentureCast

This guide will help you get VentureCast running with Docker in just a few minutes!

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Docker Desktop** installed:
   - [Mac](https://docs.docker.com/desktop/install/mac-install/)
   - [Windows](https://docs.docker.com/desktop/install/windows-install/)
   - [Linux](https://docs.docker.com/desktop/install/linux-install/)

2. **Docker Compose** (usually comes with Docker Desktop)

3. **Git** to clone the repository

## 🚀 Quick Start (5 minutes)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Venture-Cast
```

### Step 2: Set Up Environment Variables

The backend needs a `.env` file with your API keys. If you don't have one:

```bash
# This creates a basic .env file with placeholder values
./scripts/docker-setup.sh
```

Or create it manually:

```bash
# Create the .env file
touch VentureCast_Backend-main/.env

# Add your API keys (edit with your favorite text editor)
nano VentureCast_Backend-main/.env
```

Add these variables to the `.env` file:

```env
PORT=3001
SESSION_SECRET=your-secret-here
STRIPE_SECRET_KEY=sk_test_your_stripe_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=optional
APPLE_TEAM_ID=optional
APPLE_KEY_ID=optional
```

### Step 3: Start Everything with Docker

```bash
# Build and start all services
docker-compose up -d

# Or use the Makefile shortcut
make up
```

That's it! 🎉 The application is now running!

### Step 4: Access the Application

- **Backend API**: http://localhost:3001
- **Frontend Metro Bundler**: http://localhost:8081
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 📱 Running the Mobile App

### iOS (Mac only)

```bash
# 1. Docker is already running the Metro bundler
# 2. In a new terminal, run the iOS app
cd VentureCast_Frontend-main
npx react-native run-ios
```

### Android

```bash
# 1. Start an Android emulator or connect a device
# 2. Run the Android app
cd VentureCast_Frontend-main
npx react-native run-android
```

## 🔧 Daily Development Workflow

### Starting Your Development Environment

```bash
# Start all services
docker-compose up -d

# Or start specific services
docker-compose up backend mongodb  # Just backend and database
docker-compose up frontend         # Just frontend
```

### Viewing Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Or use Makefile shortcuts
make logs           # All logs
make logs-backend   # Backend only
make logs-frontend  # Frontend only
```

### Making Code Changes

**Backend Changes:**
- Edit files in `VentureCast_Backend-main/`
- Changes auto-reload thanks to nodemon
- Check logs if something doesn't work: `docker-compose logs -f backend`

**Frontend Changes:**
- Edit files in `VentureCast_Frontend-main/`
- Metro bundler auto-reloads
- Shake device or press `r` in Metro terminal to reload app

### Adding Dependencies

**Backend (npm):**

```bash
# Method 1: Install in container and copy package.json
docker-compose exec backend npm install express
docker cp venturecast-backend:/app/package.json ./VentureCast_Backend-main/
docker cp venturecast-backend:/app/package-lock.json ./VentureCast_Backend-main/

# Method 2: Install locally and rebuild
cd VentureCast_Backend-main
npm install express
cd ..
docker-compose build backend
docker-compose up -d backend
```

**Frontend (yarn):**

```bash
# Method 1: Install in container
docker-compose exec frontend yarn add react-native-elements
docker cp venturecast-frontend:/app/package.json ./VentureCast_Frontend-main/
docker cp venturecast-frontend:/app/yarn.lock ./VentureCast_Frontend-main/

# Method 2: Install locally and rebuild
cd VentureCast_Frontend-main
yarn add react-native-elements
cd ..
docker-compose build frontend
docker-compose up -d frontend
```

### Accessing Container Shells

```bash
# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Access MongoDB shell
docker-compose exec mongodb mongosh

# Or use Makefile shortcuts
make shell-backend
make shell-frontend
make shell-mongo
```

### Stopping Services

```bash
# Stop all services (keeps data)
docker-compose down

# Or use Makefile
make down
```

## 🗄️ Database Management

### Viewing MongoDB Data

```bash
# Connect to MongoDB shell
docker-compose exec mongodb mongosh

# In MongoDB shell:
use venture-cast-backend
show collections
db.users.find()
```

### Backing Up Database

```bash
# Create backup
docker-compose exec mongodb mongodump --db=venture-cast-backend --out=/backup
docker cp venturecast-mongodb:/backup ./backup-$(date +%Y%m%d)

# Or use Makefile
make db-backup
```

### Restoring Database

```bash
# Restore from backup
docker cp ./backup-folder venturecast-mongodb:/restore
docker-compose exec mongodb mongorestore --db=venture-cast-backend /restore/venture-cast-backend
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. "Port already in use" Error

```bash
# Find what's using the port
lsof -i :3001  # Check backend port
lsof -i :8081  # Check frontend port

# Kill the process or change the port in docker-compose.yml
```

#### 2. MongoDB Connection Failed

```bash
# Check if MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

#### 3. Metro Bundler Not Working

```bash
# Clear Metro cache
docker-compose exec frontend yarn start --reset-cache

# Rebuild frontend container
docker-compose build frontend
docker-compose up -d frontend
```

#### 4. Changes Not Reflecting

```bash
# Restart the service
docker-compose restart backend  # or frontend

# If that doesn't work, rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

#### 5. Permission Errors

```bash
# Fix permissions in container
docker-compose exec backend chown -R node:node /app
```

### Complete Reset

If things get really messed up:

```bash
# Stop and remove everything
docker-compose down -v
docker system prune -af

# Start fresh
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Monitoring and Health Checks

### Check Service Status

```bash
# See all running containers
docker-compose ps

# Check service health
make health

# Manual health checks
curl http://localhost:3001/          # Backend
curl http://localhost:8081/status    # Frontend
```

### Resource Usage

```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df
```

## 🚢 Production Deployment

### Building for Production

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Environment Variables

For production, update your `.env` file with:
- Strong `SESSION_SECRET`
- Production Stripe keys
- Production OAuth credentials
- Database authentication credentials

## 📚 Useful Commands Reference

### Makefile Commands

```bash
make up             # Start all services
make down           # Stop all services
make restart        # Restart all services
make logs           # View all logs
make logs-backend   # View backend logs
make logs-frontend  # View frontend logs
make shell-backend  # Access backend shell
make shell-frontend # Access frontend shell
make shell-mongo    # Access MongoDB shell
make clean          # Remove everything (including data)
make health         # Check service health
```

### Docker Compose Commands

```bash
docker-compose up -d                # Start in background
docker-compose down                 # Stop services
docker-compose restart              # Restart services
docker-compose logs -f              # Follow logs
docker-compose exec <service> sh    # Access shell
docker-compose build                # Rebuild images
docker-compose ps                   # List containers
```

## 💡 Tips for Efficient Development

1. **Use Multiple Terminals**: Keep one for logs, one for running commands
2. **Alias Commands**: Add aliases to your shell profile:
   ```bash
   alias dc='docker-compose'
   alias dcl='docker-compose logs -f'
   alias dcr='docker-compose restart'
   ```

3. **VS Code Docker Extension**: Install the Docker extension for visual container management

4. **Hot Reload**: Both frontend and backend support hot reload - no need to restart for code changes

5. **Selective Services**: Only run what you need:
   ```bash
   docker-compose up backend mongodb  # Skip frontend if doing API work
   ```

## 🆘 Getting Help

If you run into issues:

1. Check the logs first: `docker-compose logs -f`
2. Ensure Docker Desktop has enough resources (4GB RAM minimum)
3. Try the troubleshooting steps above
4. Check if your `.env` file has all required variables
5. Create an issue in the repository with:
   - Error message
   - Output of `docker-compose ps`
   - Relevant logs from `docker-compose logs`

## 🔄 Updating the Docker Setup

When pulling new changes:

```bash
# Pull latest code
git pull

# Rebuild if Dockerfile or dependencies changed
docker-compose build

# Restart services
docker-compose up -d
```

---

Happy coding! 🚀 The Docker setup handles all the infrastructure so you can focus on building features.