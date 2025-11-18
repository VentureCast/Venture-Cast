# VentureCast

A React Native mobile application for trading creator/streamer stocks with real-time market simulation.

## 🚀 Quick Start

### Recommended Setup (Hybrid Docker)

The fastest way to get started is using our **hybrid approach** - backend services in Docker, frontend running locally:

```bash
# 1. Start backend services in Docker
docker-compose up -d backend mongodb redis

# 2. Start frontend Metro bundler (in new terminal)
cd VentureCast_Frontend-main
yarn start

# 3. Run the mobile app (in another terminal)
cd VentureCast_Frontend-main
yarn ios    # or yarn android
```

**Why hybrid?** React Native's Metro bundler and Yarn PnP work better natively, while Docker perfectly manages your databases and backend API.

📖 **Full guide**: [documentation/docker-hybrid-setup.md](documentation/docker-hybrid-setup.md)

### Alternative: Full Docker Setup

You can also run everything in Docker (note: frontend may have Yarn PnP volume issues):

```bash
# Start all services
docker-compose up -d

# Test the setup
make test-docker
```

📖 **Full guide**: [documentation/docker-setup.md](documentation/docker-setup.md)

## 📋 Prerequisites

- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Node.js 18+** (for local frontend development)
- **Yarn 3.6.4** (installed via corepack)
- **Xcode** (for iOS development on Mac)
- **Android Studio** (for Android development)

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         React Native Frontend           │
│   (TypeScript, Yarn PnP, Metro)        │
│         Port: 8081 (local)             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Express.js Backend API             │
│   (Node.js, Passport, Stripe)          │
│         Port: 3001 (Docker)            │
└─────────┬───────────────┬───────────────┘
          │               │
          ▼               ▼
┌─────────────────┐  ┌──────────────────┐
│    MongoDB      │  │      Redis       │
│  Port: 27017    │  │   Port: 6379     │
│    (Docker)     │  │    (Docker)      │
└─────────────────┘  └──────────────────┘
```

### Tech Stack

- **Frontend**: React Native 0.75.4, TypeScript, React Navigation, Supabase Auth
- **Backend**: Express.js, MongoDB (Mongoose), Redis, Passport.js
- **Payments**: Stripe integration
- **Authentication**: Supabase + Google/Apple OAuth
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
Venture-Cast/
├── VentureCast_Frontend-main/   # React Native mobile app
│   ├── Pages/                   # Screen components
│   ├── Assets/                  # Images, icons, fonts
│   ├── App.tsx                  # Entry point
│   ├── package.json             # Dependencies
│   └── .yarnrc.yml             # Yarn PnP config
│
├── VentureCast_Backend-main/    # Express.js API
│   ├── routes/                  # API endpoints
│   ├── models/                  # MongoDB schemas
│   ├── config/                  # Database config
│   ├── index.js                 # Server entry point
│   └── .env                     # Environment variables
│
├── documentation/               # Comprehensive guides
│   ├── docker-hybrid-setup.md  # ⭐ Recommended setup
│   ├── docker-setup.md         # Full Docker guide
│   ├── docker-testing.md       # Testing procedures
│   ├── docker-quick-reference.md
│   └── docker-troubleshooting.md
│
├── scripts/                     # Utility scripts
│   ├── test-docker.sh          # Automated testing
│   └── docker-setup.sh         # Initial setup
│
├── docker-compose.yml          # Docker orchestration
├── docker-compose.prod.yml     # Production config
├── Makefile                    # Convenient commands
└── CLAUDE.md                   # AI assistant context

```

## 🎯 Key Features

- **Real-time Stock Trading**: Buy, sell, and short creator stocks
- **Portfolio Management**: Track your investments and performance
- **Streamer Discovery**: Browse and research creators
- **Payment Integration**: Deposit/withdraw funds via Stripe
- **Social Authentication**: Sign in with Google or Apple
- **Live Market Data**: Real-time price updates and charts

## 🛠️ Development

### Environment Setup

Create `VentureCast_Backend-main/.env`:

```env
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_your_stripe_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=mongodb://mongodb:27017/venture-cast-backend
```

### Useful Commands

```bash
# Docker Management
make up              # Start all services
make down            # Stop all services
make restart         # Restart all services
make logs            # View all logs
make test-docker     # Test Docker setup

# Backend Development
make dev-backend     # Start only backend + databases
make logs-backend    # View backend logs
make shell-backend   # Access backend container

# Database
make shell-mongo     # Access MongoDB shell
make db-backup       # Backup database

# Cleanup
make clean           # Remove all containers and volumes
docker system prune  # Clean up Docker resources
```

### Daily Workflow

```bash
# Morning: Start your dev environment
make dev-backend                    # Start backend in Docker
cd VentureCast_Frontend-main
yarn start                          # Start Metro bundler

# In another terminal: Run the app
yarn ios                            # or yarn android

# During development:
# - Edit backend code → auto-reloads via nodemon
# - Edit frontend code → shake device or press 'r' in Metro
# - Check logs: make logs-backend

# Evening: Stop services
docker-compose down
# Metro stops when you Ctrl+C the terminal
```

## 🧪 Testing

### Test Docker Setup

```bash
# Automated test script
make test-docker

# Manual checks
curl http://localhost:3001/                                    # Backend
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"  # MongoDB
docker-compose exec redis redis-cli ping                       # Redis
```

### Run App Tests

```bash
# Frontend tests
cd VentureCast_Frontend-main
yarn test

# Backend tests (if configured)
cd VentureCast_Backend-main
npm test
```

## 📚 Documentation

All documentation is in the [`documentation/`](documentation/) folder:

- **[Docker Hybrid Setup](documentation/docker-hybrid-setup.md)** - ⭐ Recommended approach
- **[Docker Setup Guide](documentation/docker-setup.md)** - Complete Docker setup
- **[Docker Testing](documentation/docker-testing.md)** - Testing procedures
- **[Quick Reference](documentation/docker-quick-reference.md)** - Command cheat sheet
- **[Troubleshooting](documentation/docker-troubleshooting.md)** - Common issues
- **[Docker Status](documentation/docker-status.md)** - Current setup status

## 🐛 Troubleshooting

### Backend not responding?
```bash
docker-compose logs backend
docker-compose restart backend
```

### MongoDB connection failed?
```bash
docker-compose logs mongodb
docker-compose restart mongodb
```

### Frontend Metro bundler issues?
```bash
cd VentureCast_Frontend-main
yarn start --reset-cache
```

### Need a complete reset?
```bash
make clean
docker-compose build --no-cache
docker-compose up -d
```

📖 **More solutions**: [documentation/docker-troubleshooting.md](documentation/docker-troubleshooting.md)

## 🚢 Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Important for production**:
- Use strong `SESSION_SECRET`
- Use production Stripe keys
- Enable MongoDB authentication
- Configure SSL certificates for Nginx
- Set up proper logging and monitoring

## 📱 Mobile App Development

### iOS
```bash
cd VentureCast_Frontend-main
yarn ios                    # Run on simulator
yarn ios --device          # Run on physical device
```

### Android
```bash
cd VentureCast_Frontend-main
yarn android               # Run on emulator/device
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly: `make test-docker`
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## 📄 License

[Add your license here]

## 🆘 Support

- Check the [documentation](documentation/) first
- Review [troubleshooting guide](documentation/docker-troubleshooting.md)
- Check logs: `docker-compose logs -f`
- Open an issue with:
  - What you're trying to do
  - Error message
  - Output of `docker-compose ps`
  - Relevant logs

---

**Status**: ✅ Backend, MongoDB, and Redis running in Docker. Frontend recommended to run locally for best experience.

**Last Updated**: November 2024
