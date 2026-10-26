const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

// In-memory user store for offline / mock testing when DB is disconnected
const inMemoryUsers = new Map();

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please sign in again.',
      });
    }

    if (isDbConnected()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User account associated with this token no longer exists.',
        });
      }
      req.user = user;
    } else {
      // Memory fallback
      const user = inMemoryUsers.get(decoded.id) || {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || 'Demo Signer',
        email: decoded.email || 'signer@isl.demo',
        preferredInterfaceLanguage: 'en',
        preferredSpeechLanguage: 'en-IN',
        saveHistoryEnabled: true,
      };
      req.user = user;
    }

    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (isDbConnected()) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } else {
      req.user = inMemoryUsers.get(decoded.id) || {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || 'Demo Signer',
        email: decoded.email,
        saveHistoryEnabled: true,
      };
    }
  } catch (err) {
    // Ignore invalid token in optional auth
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  inMemoryUsers,
};
