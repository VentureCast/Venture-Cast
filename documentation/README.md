# VentureCast Documentation

Welcome to the VentureCast documentation! This folder contains guides and references for developing and deploying the application.

## 📚 Available Documentation

### Docker & Development

1. **[Docker Setup Guide](./docker-setup.md)** 🚀
   - Complete guide for setting up Docker
   - Step-by-step instructions for new developers
   - Development workflow with Docker
   - Database management
   - Adding dependencies
   - Production deployment

2. **[Docker Quick Reference](./docker-quick-reference.md)** ⚡
   - Essential commands cheat sheet
   - Common tasks and shortcuts
   - Quick debugging commands
   - Keep this open while developing!

3. **[Docker Troubleshooting](./docker-troubleshooting.md)** 🔧
   - Common problems and solutions
   - Error messages explained
   - Diagnostic commands
   - Reset procedures
   - Debugging checklist

### Project Documentation

4. **[Main Docker Documentation](../DOCKER.md)** 📋
   - Technical architecture details
   - Service configurations
   - Environment variables
   - CI/CD integration
   - Performance optimization

5. **[Claude AI Instructions](../CLAUDE.md)** 🤖
   - Code architecture overview
   - Project structure
   - Development commands
   - Database schemas
   - Navigation flows

## 🎯 Quick Links for New Developers

**First time setup?** Start here:
1. Read [Docker Setup Guide](./docker-setup.md) - Section "Quick Start"
2. Keep [Docker Quick Reference](./docker-quick-reference.md) handy
3. If you hit issues, check [Docker Troubleshooting](./docker-troubleshooting.md)

**Daily development?**
- [Docker Quick Reference](./docker-quick-reference.md) - All commands you need
- [Docker Setup Guide](./docker-setup.md) - Section "Daily Development Workflow"

**Something broken?**
- [Docker Troubleshooting](./docker-troubleshooting.md) - Solutions to common problems

## 🛠️ Development Environment

### Prerequisites
- Docker Desktop
- Git
- Node.js (optional, for local development)
- Xcode (for iOS development)
- Android Studio (for Android development)

### Key Technologies
- **Frontend**: React Native, TypeScript, Yarn 3.6.4
- **Backend**: Node.js, Express, MongoDB, Redis
- **Containerization**: Docker, Docker Compose
- **Package Management**: npm (backend), Yarn with PnP (frontend)

## 📦 Project Structure

```
Venture-Cast/
├── VentureCast_Frontend-main/  # React Native mobile app
├── VentureCast_Backend-main/   # Express.js API server
├── documentation/               # This documentation folder
├── scripts/                     # Utility scripts
├── docker-compose.yml           # Docker orchestration
├── Makefile                     # Convenient commands
└── nginx.conf                   # Production proxy config
```

## 🚀 Getting Started

### For New Developers

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Venture-Cast
   ```

2. **Run the setup script**
   ```bash
   ./scripts/docker-setup.sh
   ```

3. **Start Docker**
   ```bash
   docker-compose up -d
   # or
   make up
   ```

4. **Verify everything is running**
   ```bash
   docker-compose ps
   make health
   ```

5. **Check the logs**
   ```bash
   docker-compose logs -f
   # or
   make logs
   ```

### Access Points

- Backend API: http://localhost:3001
- Frontend Metro: http://localhost:8081
- MongoDB: localhost:27017
- Redis: localhost:6379

## 💡 Best Practices

1. **Always check logs first** when debugging
2. **Use Make commands** for common tasks (shorter to type)
3. **Keep Docker Desktop updated** to avoid compatibility issues
4. **Allocate enough resources** to Docker (4GB RAM minimum)
5. **Use hot reload** - no need to restart for code changes
6. **Commit .env.example** files but never .env files

## 📝 Contributing to Documentation

When adding new documentation:

1. Place it in this `documentation/` folder
2. Use clear, descriptive filenames
3. Add it to this README index
4. Follow the existing format and style
5. Include practical examples
6. Test all commands before documenting

## 🆘 Need Help?

1. Check the relevant documentation first
2. Look at the troubleshooting guide
3. Check Docker logs: `docker-compose logs -f`
4. Ask in the team chat with:
   - What you're trying to do
   - The error message
   - What you've already tried

---

*Last updated: November 2024*