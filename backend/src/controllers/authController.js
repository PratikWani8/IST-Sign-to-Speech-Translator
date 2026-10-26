const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { isDbConnected } = require('../config/db');
const { inMemoryUsers } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

let mockUserIdCounter = 1;

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, preferredInterfaceLanguage, preferredSpeechLanguage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.',
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        preferredInterfaceLanguage: preferredInterfaceLanguage || 'en',
        preferredSpeechLanguage: preferredSpeechLanguage || 'en-IN',
      });

      const token = generateToken({ id: user._id, name: user.name, email: user.email });

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferredInterfaceLanguage: user.preferredInterfaceLanguage,
          preferredSpeechLanguage: user.preferredSpeechLanguage,
          saveHistoryEnabled: user.saveHistoryEnabled,
        },
      });
    } else {
      // Memory fallback for demo / test environments
      for (const u of inMemoryUsers.values()) {
        if (u.email === cleanEmail) {
          return res.status(409).json({
            success: false,
            error: 'An account with this email address already exists.',
          });
        }
      }

      const userId = `mock_user_${mockUserIdCounter++}`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = {
        _id: userId,
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        preferredInterfaceLanguage: preferredInterfaceLanguage || 'en',
        preferredSpeechLanguage: preferredSpeechLanguage || 'en-IN',
        saveHistoryEnabled: true,
        createdAt: new Date(),
      };
      inMemoryUsers.set(userId, newUser);

      const token = generateToken({ id: userId, name: newUser.name, email: newUser.email });

      return res.status(201).json({
        success: true,
        message: 'Registration successful (offline storage)',
        token,
        user: {
          id: userId,
          name: newUser.name,
          email: newUser.email,
          preferredInterfaceLanguage: newUser.preferredInterfaceLanguage,
          preferredSpeechLanguage: newUser.preferredSpeechLanguage,
          saveHistoryEnabled: newUser.saveHistoryEnabled,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials.',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials.',
        });
      }

      const token = generateToken({ id: user._id, name: user.name, email: user.email });

      return res.json({
        success: true,
        message: 'Signed in successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferredInterfaceLanguage: user.preferredInterfaceLanguage,
          preferredSpeechLanguage: user.preferredSpeechLanguage,
          saveHistoryEnabled: user.saveHistoryEnabled,
        },
      });
    } else {
      // Memory fallback
      let user = null;
      for (const u of inMemoryUsers.values()) {
        if (u.email === cleanEmail) {
          user = u;
          break;
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials.',
        });
      }

      const token = generateToken({ id: user.id, name: user.name, email: user.email });

      return res.json({
        success: true,
        message: 'Signed in successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          preferredInterfaceLanguage: user.preferredInterfaceLanguage,
          preferredSpeechLanguage: user.preferredSpeechLanguage,
          saveHistoryEnabled: user.saveHistoryEnabled,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        preferredInterfaceLanguage: req.user.preferredInterfaceLanguage,
        preferredSpeechLanguage: req.user.preferredSpeechLanguage,
        saveHistoryEnabled: req.user.saveHistoryEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, preferredInterfaceLanguage, preferredSpeechLanguage, saveHistoryEnabled } = req.body;
    const userId = req.user._id || req.user.id;

    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (name) user.name = name.trim();
      if (preferredInterfaceLanguage) user.preferredInterfaceLanguage = preferredInterfaceLanguage;
      if (preferredSpeechLanguage) user.preferredSpeechLanguage = preferredSpeechLanguage;
      if (saveHistoryEnabled !== undefined) user.saveHistoryEnabled = Boolean(saveHistoryEnabled);

      await user.save();

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferredInterfaceLanguage: user.preferredInterfaceLanguage,
          preferredSpeechLanguage: user.preferredSpeechLanguage,
          saveHistoryEnabled: user.saveHistoryEnabled,
        },
      });
    } else {
      const user = inMemoryUsers.get(userId);
      if (user) {
        if (name) user.name = name.trim();
        if (preferredInterfaceLanguage) user.preferredInterfaceLanguage = preferredInterfaceLanguage;
        if (preferredSpeechLanguage) user.preferredSpeechLanguage = preferredSpeechLanguage;
        if (saveHistoryEnabled !== undefined) user.saveHistoryEnabled = Boolean(saveHistoryEnabled);
      }
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: userId,
          name: user ? user.name : req.user.name,
          email: user ? user.email : req.user.email,
          preferredInterfaceLanguage: user ? user.preferredInterfaceLanguage : 'en',
          preferredSpeechLanguage: user ? user.preferredSpeechLanguage : 'en-IN',
          saveHistoryEnabled: user ? user.saveHistoryEnabled : true,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
