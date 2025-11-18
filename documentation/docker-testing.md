# Testing Your Docker Setup

This guide shows you how to test that your Docker environment is working correctly.

## 🚀 Quick Test

The easiest way to test everything:

```bash
# Start the services
docker-compose up -d

# Run the automated test script
make test-docker

# Or run directly:
./scripts/test-docker.sh
```

This will test all services and show you a detailed report.

## 📋 Manual Testing Steps

If you prefer to test manually, follow these steps:

### 1. Check Container Status

```bash
# See what's running
docker-compose ps

# Should show all 4 containers as "Up":
# - venturecast-backend
# - venturecast-frontend
# - venturecast-mongodb (healthy)
# - venturecast-redis (healthy)
```

### 2. Test Backend API

```bash
# Test if backend is responding
curl http://localhost:3001/

# Should return: "Venture Cast Backend Running"
```

If this fails, check the logs:
```bash
docker-compose logs backend
```

### 3. Test Frontend Metro Bundler

```bash
# Test Metro bundler
curl http://localhost:8081/status

# Or just open in browser:
# http://localhost:8081
```

Note: Metro can take 30-60 seconds to start on first run.

### 4. Test MongoDB

```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"

# Should return: { ok: 1 }
```

Explore the database:
```bash
# Enter MongoDB shell
docker-compose exec mongodb mongosh

# In the shell:
use venture-cast-backend
show collections
db.users.find()
exit
```

### 5. Test Redis

```bash
# Ping Redis
docker-compose exec redis redis-cli ping

# Should return: PONG
```

### 6. Test Backend → MongoDB Connection

```bash
# Check if backend can connect to MongoDB
docker-compose logs backend | grep "MongoDB connected"

# Should see: "MongoDB connected successfully"
```

### 7. Check Environment Variables

```bash
# Verify backend has .env loaded
docker-compose exec backend printenv | grep PORT
docker-compose exec backend printenv | grep MONGODB_URI

# Should show your configured values
```

## 🔍 Detailed Testing

### Test Backend Endpoints

If you have API endpoints set up:

```bash
# Test auth endpoint
curl http://localhost:3001/auth/

# Test streamer endpoint
curl http://localhost:3001/streamer/

# Test with JSON
curl -X POST http://localhost:3001/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

### Test Mobile App Connection

For React Native apps:

```bash
# iOS Simulator
cd VentureCast_Frontend-main
npx react-native run-ios

# Android Emulator
npx react-native run-android
```

The app should:
1. Connect to Metro bundler at localhost:8081
2. Load the JavaScript bundle
3. Connect to backend API at localhost:3001

### Test Database Operations

```bash
# Insert test data
docker-compose exec mongodb mongosh venture-cast-backend --eval '
  db.test.insertOne({name: "test", date: new Date()})
'

# Read test data
docker-compose exec mongodb mongosh venture-cast-backend --eval '
  db.test.find()
'

# Delete test data
docker-compose exec mongodb mongosh venture-cast-backend --eval '
  db.test.deleteMany({})
'
```

## 📊 Performance Testing

### Check Resource Usage

```bash
# Real-time resource monitoring
docker stats

# One-time snapshot
docker stats --no-stream
```

Look for:
- **CPU %**: Should be low when idle (< 10%)
- **Memory**: Backend ~100-200MB, Frontend ~200-400MB, MongoDB ~100-200MB
- High values might indicate issues

### Check Disk Usage

```bash
# See how much space Docker is using
docker system df

# Detailed breakdown
docker system df -v
```

## ⚡ Load Testing

Test how the backend handles requests:

```bash
# Install Apache Bench (if not installed)
# Mac: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Run 100 requests with 10 concurrent
ab -n 100 -c 10 http://localhost:3001/

# Check response times and success rate
```

## 🐛 Debugging Tests

If tests fail, check these in order:

### 1. Are containers running?
```bash
docker-compose ps
# All should show "Up" status
```

### 2. Check logs for errors
```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs mongodb
```

### 3. Is Docker Desktop running?
```bash
docker info
# Should show Docker info, not connection error
```

### 4. Are ports free?
```bash
# Check if ports are in use
lsof -i :3001
lsof -i :8081
lsof -i :27017
```

### 5. Restart problematic service
```bash
docker-compose restart backend
docker-compose logs -f backend
```

## 🔄 Testing After Changes

After making changes to code or configuration:

### Code Changes (with hot-reload)
```bash
# No testing needed - changes auto-apply
# Just check logs to verify:
docker-compose logs -f backend
```

### Dependency Changes
```bash
# Rebuild and test
docker-compose build backend
docker-compose up -d backend
make test-docker
```

### Configuration Changes
```bash
# Restart and test
docker-compose down
docker-compose up -d
make test-docker
```

### Dockerfile Changes
```bash
# Full rebuild
docker-compose build --no-cache
docker-compose up -d
make test-docker
```

## ✅ Success Checklist

Your Docker setup is working correctly if:

- [ ] All containers show "Up" status
- [ ] Backend returns "Venture Cast Backend Running"
- [ ] Metro bundler is accessible at :8081
- [ ] MongoDB ping returns `{ ok: 1 }`
- [ ] Redis ping returns `PONG`
- [ ] Backend logs show "MongoDB connected successfully"
- [ ] No error messages in logs
- [ ] Mobile app can connect and load

## 📈 Continuous Testing

Good practices for ongoing development:

1. **Run test-docker after pulling changes**
   ```bash
   git pull
   docker-compose build
   make test-docker
   ```

2. **Check logs regularly**
   ```bash
   # Keep a terminal open with logs
   docker-compose logs -f
   ```

3. **Monitor resource usage**
   ```bash
   # Occasional check
   docker stats --no-stream
   ```

4. **Clean up periodically**
   ```bash
   # Weekly cleanup
   docker system prune
   ```

## 🎯 Quick Smoke Test

Minimal test to verify everything works:

```bash
# Start services
docker-compose up -d

# Wait 30 seconds for everything to start
sleep 30

# Quick checks
docker-compose ps | grep "Up"
curl -f http://localhost:3001/ && echo "✓ Backend OK"
docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" && echo "✓ MongoDB OK"
docker-compose exec -T redis redis-cli ping && echo "✓ Redis OK"

# If all pass, you're good to go!
```

---

**Pro Tip**: Add `make test-docker` to your morning routine. It takes 10 seconds and catches issues early!