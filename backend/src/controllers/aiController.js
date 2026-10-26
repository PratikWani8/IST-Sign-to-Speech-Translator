const aiService = require('../services/aiService');

exports.predict = async (req, res, next) => {
  try {
    const { image_base64, category, confidence_threshold } = req.body;

    if (!image_base64) {
      return res.status(400).json({
        success: false,
        error: 'Webcam frame image_base64 is required for translation inference.',
      });
    }

    const result = await aiService.predictFrame({
      image_base64,
      category,
      confidence_threshold,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

exports.predictSequence = async (req, res, next) => {
  try {
    const { frames_base64, fps, min_stability_count } = req.body;

    if (!frames_base64 || !Array.isArray(frames_base64) || frames_base64.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'frames_base64 array containing at least 1 frame is required.',
      });
    }

    if (frames_base64.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 30 frames permitted per sequence request.',
      });
    }

    const result = await aiService.predictSequence({
      frames_base64,
      fps: fps || 10,
      min_stability_count: min_stability_count || 2,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getModelInfo = async (req, res, next) => {
  try {
    const result = await aiService.getModelInfo();
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
