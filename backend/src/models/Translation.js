const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recognizedText: {
      type: String,
      required: [true, 'Recognized text is required'],
      trim: true,
    },
    supportedSignIds: {
      type: [String],
      default: [],
    },
    modelId: {
      type: String,
      default: 'Hemg/Indian-sign-language-classification',
    },
    modelVersion: {
      type: String,
      default: '1.0.0',
    },
    confidenceMetadata: {
      averageConfidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      perSignConfidences: [
        {
          sign: String,
          confidence: Number,
        },
      ],
    },
    userCorrectedText: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'everyday',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

translationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Translation', translationSchema);
