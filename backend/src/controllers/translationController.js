const Translation = require('../models/Translation');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

// In-memory fallback translation store for offline mode
const inMemoryTranslations = [];
let mockTranslationCounter = 1;

exports.saveTranslation = async (req, res, next) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User must be authenticated to save translation history' });
    }

    // Check user preference
    if (req.user && req.user.saveHistoryEnabled === false) {
      return res.json({
        success: true,
        message: 'Translation completed (history saving disabled by user preference)',
        saved: false,
      });
    }

    const {
      recognizedText,
      supportedSignIds,
      modelId,
      modelVersion,
      confidenceMetadata,
      userCorrectedText,
      category,
    } = req.body;

    if (!recognizedText && !userCorrectedText) {
      return res.status(400).json({
        success: false,
        error: 'Recognized or user-corrected text is required.',
      });
    }

    if (isDbConnected()) {
      const record = await Translation.create({
        user: userId,
        recognizedText: recognizedText || userCorrectedText,
        supportedSignIds: supportedSignIds || [],
        modelId: modelId || 'Hemg/Indian-sign-language-classification',
        modelVersion: modelVersion || '1.0.0',
        confidenceMetadata: confidenceMetadata || {},
        userCorrectedText: userCorrectedText || null,
        category: category || 'everyday',
      });

      return res.status(201).json({
        success: true,
        saved: true,
        translation: record,
      });
    } else {
      // Memory fallback
      const record = {
        _id: `trans_${mockTranslationCounter++}`,
        user: userId,
        recognizedText: recognizedText || userCorrectedText,
        supportedSignIds: supportedSignIds || [],
        modelId: modelId || 'Hemg/Indian-sign-language-classification',
        modelVersion: modelVersion || '1.0.0',
        confidenceMetadata: confidenceMetadata || {},
        userCorrectedText: userCorrectedText || null,
        category: category || 'everyday',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryTranslations.unshift(record);

      return res.status(201).json({
        success: true,
        saved: true,
        translation: record,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { search, category, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (isDbConnected()) {
      const query = { user: userId };

      if (category && category !== 'all') {
        query.category = category;
      }

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { recognizedText: searchRegex },
          { userCorrectedText: searchRegex },
        ];
      }

      const total = await Translation.countDocuments(query);
      const translations = await Translation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        success: true,
        count: translations.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        translations,
      });
    } else {
      // Memory fallback
      let filtered = inMemoryTranslations.filter(
        (t) => String(t.user) === String(userId)
      );

      if (category && category !== 'all') {
        filtered = filtered.filter((t) => t.category === category);
      }

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        filtered = filtered.filter(
          (t) =>
            (t.recognizedText && t.recognizedText.toLowerCase().includes(term)) ||
            (t.userCorrectedText && t.userCorrectedText.toLowerCase().includes(term))
        );
      }

      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        count: paginated.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        translations: paginated,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteTranslation = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (isDbConnected()) {
      const translation = await Translation.findOne({ _id: id, user: userId });
      if (!translation) {
        return res.status(404).json({
          success: false,
          error: 'Translation record not found or not authorized to delete.',
        });
      }

      await translation.deleteOne();

      return res.json({
        success: true,
        message: 'Translation record deleted successfully.',
      });
    } else {
      const idx = inMemoryTranslations.findIndex(
        (t) => String(t._id) === String(id) && String(t.user) === String(userId)
      );
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          error: 'Translation record not found or not authorized to delete.',
        });
      }

      inMemoryTranslations.splice(idx, 1);
      return res.json({
        success: true,
        message: 'Translation record deleted successfully.',
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.clearHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isDbConnected()) {
      const result = await Translation.deleteMany({ user: userId });
      return res.json({
        success: true,
        message: 'All translation history cleared successfully.',
        deletedCount: result.deletedCount,
      });
    } else {
      const initialCount = inMemoryTranslations.length;
      for (let i = inMemoryTranslations.length - 1; i >= 0; i--) {
        if (String(inMemoryTranslations[i].user) === String(userId)) {
          inMemoryTranslations.splice(i, 1);
        }
      }
      return res.json({
        success: true,
        message: 'All translation history cleared successfully.',
        deletedCount: initialCount - inMemoryTranslations.length,
      });
    }
  } catch (error) {
    next(error);
  }
};
