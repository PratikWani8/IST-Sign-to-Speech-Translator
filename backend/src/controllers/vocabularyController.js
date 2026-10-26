const aiService = require('../services/aiService');

// Static fallback vocabulary for instant response if AI service is starting
const FALLBACK_CATEGORIES = [
  { id: 'everyday', name: 'Everyday Communication', description: 'Basic spelling, names, greetings, directions, and common words', sign_count: 35 },
  { id: 'healthcare', name: 'Hospital & Healthcare', description: 'Blood groups (A, B, O), Ward numbers, ICU, Doctor, Medicine, X-Ray', sign_count: 22 },
  { id: 'banking', name: 'Banking & Financial Services', description: 'PIN digits, OTP, Counter numbers, UPI, Loan, KYC, Form IDs', sign_count: 25 },
  { id: 'government', name: 'Government Offices & Public Services', description: 'Token numbers, Aadhaar/PAN characters, Desk letters, Queue tracking', sign_count: 18 },
  { id: 'education', name: 'Education & Academic', description: 'Alphabets, Numbers, Multiple-choice options (A-D), Grades, Semesters', sign_count: 20 },
];

exports.getVocabulary = async (req, res, next) => {
  try {
    const { category } = req.query;
    try {
      const data = await aiService.getVocabulary();
      let vocab = data.vocabulary || [];
      if (category && category !== 'all') {
        vocab = vocab.filter((s) => s.categories && s.categories.includes(category.toLowerCase()));
      }
      return res.json({
        success: true,
        total_signs: vocab.length,
        supported_types: data.supported_types,
        categories: data.categories,
        vocabulary: vocab,
      });
    } catch (aiErr) {
      // Fallback
      return res.json({
        success: true,
        total_signs: 35,
        supported_types: ['digit', 'letter'],
        categories: FALLBACK_CATEGORIES.map((c) => c.id),
        vocabulary: [],
        note: 'AI microservice initializing',
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      categories: FALLBACK_CATEGORIES,
    });
  } catch (error) {
    next(error);
  }
};
