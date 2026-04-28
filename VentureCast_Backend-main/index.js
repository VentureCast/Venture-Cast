const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { authLimiter, paymentLimiter, tradeLimiter, apiLimiter } = require('./middleware/rateLimiters');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tradeRoutes = require('./routes/trade');
const streamerRoutes = require('./routes/Streamers');
const stripeRoutes = require('./routes/stripe');
const webhookRoutes = require('./routes/webhook');
const watchlistRoutes = require('./routes/watchlist');

dotenv.config();

// IMPORTANT: Webhook route must use raw body parser BEFORE json middleware
// This is required for Stripe signature verification
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - restrict to known origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Request logging (after webhook, so webhook raw body isn't logged as text)
app.use(requestLogger);

// Body parsers with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Connect to database (skip in test — tests manage their own connection)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'VentureCast Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isHealthy ? 'connected' : 'disconnected',
  });
});

// API Routes with rate limiters
app.use('/auth', authLimiter, authRoutes);
app.use('/', apiLimiter, userRoutes);
app.use('/', tradeLimiter, tradeRoutes);
app.use('/streamer', apiLimiter, streamerRoutes);
app.use('/stripe', paymentLimiter, stripeRoutes);
app.use('/watchlist', apiLimiter, watchlistRoutes);

// 404 handler (must be before error handler)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Only start server when run directly (not imported for tests)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const HOST = process.env.HOST || '0.0.0.0';
  const server = app.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      mongoose.connection.close(false).then(() => process.exit(0));
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      mongoose.connection.close(false).then(() => process.exit(0));
    });
  });
}

module.exports = app;
