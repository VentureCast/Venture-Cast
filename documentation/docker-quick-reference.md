# Docker Quick Reference Card

## 🚦 Essential Commands

### Start/Stop

```bash
# Start everything
docker-compose up -d
make up

# Stop everything
docker-compose down
make down

# Restart
docker-compose restart
make restart
```

### Logs

```bash
# All logs
docker-compose logs -f
make logs

# Specific service
docker-compose logs -f backend
make logs-backend
```

### Shell Access

```bash
# Backend shell
docker-compose exec backend sh
make shell-backend

# MongoDB shell
docker-compose exec mongodb mongosh
make shell-mongo
```

## 🔍 Debugging

```bash
# Check what's running
docker-compose ps

# Check service health
curl http://localhost:3001/
curl http://localhost:8081/status

# Clear and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📦 Dependencies

```bash
# Add npm package (backend)
docker-compose exec backend npm install <package>
docker cp venturecast-backend:/app/package*.json ./VentureCast_Backend-main/

# Add yarn package (frontend)
docker-compose exec frontend yarn add <package>
docker cp venturecast-frontend:/app/package.json ./VentureCast_Frontend-main/
docker cp venturecast-frontend:/app/yarn.lock ./VentureCast_Frontend-main/
```

## 🗄️ Database

```bash
# MongoDB shell
docker-compose exec mongodb mongosh

# In MongoDB:
use venture-cast-backend
show collections
db.users.find()
db.users.countDocuments()
```

## 🔥 Hot Tips

1. **Backend auto-reloads** - Just save your files
2. **Frontend auto-reloads** - Metro bundler detects changes
3. **Check logs first** - Most issues are visible in logs
4. **Use make commands** - Shorter and easier to remember

## 🚨 If Things Break

```bash
# Nuclear option - removes everything
make clean

# Gentler restart
docker-compose restart backend
docker-compose logs -f backend
```

## 📍 Service URLs

- Backend API: `http://localhost:3001`
- Frontend Metro: `http://localhost:8081`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

---

Keep this handy! 📌