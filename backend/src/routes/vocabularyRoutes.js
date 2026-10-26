const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabularyController');

router.get('/', vocabularyController.getVocabulary);
router.get('/categories', vocabularyController.getCategories);

module.exports = router;
