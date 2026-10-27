const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { MAX_UPLOAD_SIZE, CORS_ORIGIN, NODE_ENV } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const translationRoutes = require('./routes/translationRoutes');
const vocabularyRoutes = require('./routes/vocabularyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Security Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev flexible
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: MAX_UPLOAD_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_UPLOAD_SIZE }));

// Logger
if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter
app.use('/api', apiLimiter);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'ISL Sign-to-Speech Translation Platform API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
