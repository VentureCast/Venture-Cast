# Docker Troubleshooting Guide

## 🔴 Common Problems and Solutions

### Problem: "Cannot connect to the Docker daemon"

**Error Message:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
1. Make sure Docker Desktop is running
2. On Mac: Check Docker icon in menu bar
3. On Windows: Check Docker in system tray
4. Restart Docker Desktop if needed

---

### Problem: "Port already in use"

**Error Message:**
```
bind: address already in use
Error starting userland proxy: listen tcp4 0.0.0.0:3001
```

**Solutions:**

**Option 1: Find and kill the process**
```bash
# Find what's using the port
lsof -i :3001
lsof -i :8081
lsof -i :27017

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

**Option 2: Change the port in docker-compose.yml**
```yaml
backend:
  ports:
    - "3002:3001"  # Changed from 3001:3001
```

---

### Problem: "MongoDB connection failed"

**Error Messages:**
```
MongoDB connection error: MongoServerError: connect ECONNREFUSED
```

**Solutions:**

1. **Check if MongoDB is running:**
   ```bash
   docker-compose ps
   # Should show: venturecast-mongodb ... Up
   ```

2. **Check MongoDB logs:**
   ```bash
   docker-compose logs mongodb
   ```

3. **Restart MongoDB:**
   ```bash
   docker-compose restart mongodb
   ```

4. **Wait for MongoDB to be ready:**
   - MongoDB can take 30-60 seconds to initialize on first run
   - The backend will retry connection automatically

---

### Problem: "Metro bundler not accessible"

**Error Message:**
```
Could not connect to development server
```

**Solutions:**

1. **Check if frontend is running:**
   ```bash
   docker-compose ps frontend
   ```

2. **Reset Metro cache:**
   ```bash
   docker-compose exec frontend yarn start --reset-cache
   ```

3. **Rebuild frontend:**
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

4. **For mobile app connection:**
   - Ensure phone/emulator is on same network
   - Check firewall settings

---

### Problem: "Changes not reflecting"

**Symptoms:**
- Saved changes don't appear
- Old code still running

**Solutions:**

1. **For backend:**
   ```bash
   # Check if nodemon is detecting changes
   docker-compose logs -f backend

   # Restart if needed
   docker-compose restart backend
   ```

2. **For frontend:**
   ```bash
   # Press 'r' in Metro terminal or shake device

   # Or restart Metro
   docker-compose restart frontend
   ```

3. **Nuclear option - rebuild:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

---

### Problem: "Permission denied" errors

**Error Message:**
```
EACCES: permission denied
```

**Solutions:**

1. **Fix permissions in container:**
   ```bash
   docker-compose exec backend chown -R node:node /app
   ```

2. **On Linux host, fix volume permissions:**
   ```bash
   sudo chown -R $USER:$USER VentureCast_Backend-main
   sudo chown -R $USER:$USER VentureCast_Frontend-main
   ```

---

### Problem: "Out of disk space"

**Error Message:**
```
no space left on device
```

**Solutions:**

1. **Check Docker disk usage:**
   ```bash
   docker system df
   ```

2. **Clean up unused resources:**
   ```bash
   # Remove stopped containers
   docker container prune

   # Remove unused images
   docker image prune -a

   # Remove unused volumes (WARNING: deletes data)
   docker volume prune

   # Nuclear cleanup (removes everything)
   docker system prune -a --volumes
   ```

3. **Increase Docker Desktop disk space:**
   - Docker Desktop → Preferences → Resources → Disk image size

---

### Problem: "Module not found" after adding dependencies

**Error Message:**
```
Error: Cannot find module 'express-session'
```

**Solutions:**

1. **Rebuild the container:**
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

2. **Or install in container and sync:**
   ```bash
   docker-compose exec backend npm install
   docker cp venturecast-backend:/app/package.json ./VentureCast_Backend-main/
   docker cp venturecast-backend:/app/package-lock.json ./VentureCast_Backend-main/
   ```

---

### Problem: "Environment variables not working"

**Symptoms:**
- API keys not being recognized
- "undefined" values for env vars

**Solutions:**

1. **Check .env file exists:**
   ```bash
   cat VentureCast_Backend-main/.env
   ```

2. **Restart containers after .env changes:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Verify env vars in container:**
   ```bash
   docker-compose exec backend printenv | grep STRIPE
   ```

---

### Problem: "Docker is slow on Mac"

**Solutions:**

1. **Increase Docker resources:**
   - Docker Desktop → Preferences → Resources
   - Increase CPUs to 4+
   - Increase Memory to 4GB+

2. **Use named volumes instead of bind mounts for node_modules:**
   - Already configured in our docker-compose.yml

3. **Disable "Use gRPC FUSE" in Docker Desktop experimental features**

---

## 🛠️ Diagnostic Commands

### Check Everything

```bash
# What's running?
docker-compose ps

# Check logs
docker-compose logs --tail=50

# Check resource usage
docker stats

# Check network
docker network ls
docker network inspect venture-cast_venturecast-network

# Check volumes
docker volume ls
```

### Test Services

```bash
# Test backend
curl http://localhost:3001/
curl http://localhost:3001/health

# Test MongoDB
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"

# Test Redis
docker-compose exec redis redis-cli ping
```

### Debug Commands

```bash
# Enter container and debug
docker-compose exec backend sh
> node --version
> npm list
> cat .env
> curl http://localhost:3001

# Check file permissions
docker-compose exec backend ls -la

# Check running processes
docker-compose exec backend ps aux
```

---

## 🔄 Reset Procedures

### Soft Reset (keeps data)

```bash
docker-compose down
docker-compose up -d
```

### Medium Reset (rebuilds containers)

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Hard Reset (removes everything)

```bash
# WARNING: This deletes all data!
docker-compose down -v
docker system prune -af
rm -rf VentureCast_Backend-main/node_modules
rm -rf VentureCast_Frontend-main/node_modules
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Debugging Checklist

When something isn't working, check these in order:

- [ ] Is Docker Desktop running?
- [ ] Are all containers up? (`docker-compose ps`)
- [ ] Check logs for errors (`docker-compose logs`)
- [ ] Is .env file present and correct?
- [ ] Are ports available? (no conflicts)
- [ ] Try restarting the problematic service
- [ ] Try rebuilding if dependencies changed
- [ ] Check Docker Desktop resources (RAM/CPU)
- [ ] Try the nuclear reset as last resort

---

## 🆘 Still Stuck?

If none of the above helps:

1. **Collect diagnostic info:**
   ```bash
   docker-compose ps > docker-debug.txt
   docker-compose logs --tail=100 >> docker-debug.txt
   docker version >> docker-debug.txt
   ```

2. **Check system requirements:**
   - Docker Desktop has 4GB+ RAM allocated
   - 10GB+ free disk space
   - Latest Docker Desktop version

3. **Create a detailed issue with:**
   - Error message (full text)
   - What you were trying to do
   - Output of diagnostic commands
   - OS and Docker version

Remember: Most issues are solved by checking logs and restarting services!