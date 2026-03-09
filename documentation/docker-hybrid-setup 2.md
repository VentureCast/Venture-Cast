# Hybrid Docker Setup (Recommended)

Due to Yarn PnP complexities with Docker volumes, we recommend a **hybrid approach** for development:

## 🎯 Recommended Setup

- **Backend, MongoDB, Redis**: Run in Docker ✅
- **Frontend (Metro Bundler)**: Run locally ✅

This gives you the best of both worlds:
- Infrastructure managed by Docker (databases, backend)
- Fast frontend development without volume/PnP issues

## 🚀 Quick Start

### 1. Start Backend Services with Docker

```bash
# Start only backend and databases
docker-compose up -d backend mongodb redis

# Verify they're running
docker-compose ps

# Check backend
curl http://localhost:3001/
# Should show: "Venture Cast Backend Running"
```

### 2. Run Frontend Locally

```bash
# In a new terminal
cd VentureCast_Frontend-main

# Start Metro bundler
yarn start

# In another terminal, run your app:
# For iOS:
yarn ios

# For Android:
yarn android
```

## 📊 What's Running Where

| Service | Location | Port | URL |
|---------|----------|------|-----|
| MongoDB | Docker | 27017 | localhost:27017 |
| Redis | Docker | 6379 | localhost:6379 |
| Backend API | Docker | 3001 | http://localhost:3001 |
| **Metro Bundler** | **Local** | 8081 | http://localhost:8081 |

## ✅ Benefits of Hybrid Setup

1. **No Yarn PnP/Docker conflicts** - Frontend runs natively
2. **Faster development** - No volume sync delays
3. **Hot reload works perfectly** - Native file watching
4. **Easy debugging** - Direct access to Metro bundler
5. **Infrastructure still managed** - Databases in Docker

## 🔧 Daily Workflow

### Morning Startup

```bash
# Start backend services
make dev-backend
# or: docker-compose up -d backend mongodb redis

# Start frontend in separate terminal
cd VentureCast_Frontend-main && yarn start

# Run mobile app
yarn ios  # or yarn android
```

### During Development

- Edit backend code → Auto-reloads in Docker
- Edit frontend code → Metro auto-reloads
- Check logs: `docker-compose logs -f backend`

### End of Day

```bash
# Stop Docker services
docker-compose down

# Metro stops when you close the terminal (Ctrl+C)
```

## 🛠️ Make Commands

I've added convenient commands to the Makefile:

```bash
# Start only backend + databases
make dev-backend

# Start only frontend (still uses Docker - has issues)
make dev-frontend

# Start everything (not recommended due to frontend issues)
make up
```

## 🐛 Troubleshooting

### Backend Not Connecting

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend Can't Connect to Backend

The frontend should connect to `http://localhost:3001`. Check:

```bash
# Test backend
curl http://localhost:3001/

# Check if port 3001 is open
lsof -i :3001
```

### MongoDB Connection Issues

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test MongoDB
docker-compose exec mongodb mongosh
```

## 🚀 Full Docker Setup (Alternative)

If you want to run frontend in Docker anyway (not recommended):

1. **Remove the frontend volume mount** (this causes the issue)
2. **Rebuild without mounting code**

Or just accept that you need to rebuild the frontend container each time you change code (slow).

## 📝 Summary

**For Best Experience:**

```bash
# Terminal 1: Backend services in Docker
docker-compose up backend mongodb redis

# Terminal 2: Frontend Metro bundler locally
cd VentureCast_Frontend-main && yarn start

# Terminal 3: Run the mobile app
cd VentureCast_Frontend-main && yarn ios
```

This setup is fast, reliable, and gives you the benefits of Docker for infrastructure without the headaches of running React Native in Docker.

---

**Why This Works Better:**
- React Native Metro bundler has file watchers that work better natively
- Yarn PnP creates symlinks that don't play well with Docker volumes
- Backend is stateless and works great in Docker
- Databases are perfect for Docker (isolated, persistent)

Stick with this hybrid approach for the smoothest development experience!