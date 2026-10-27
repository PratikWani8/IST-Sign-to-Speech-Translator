const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, translationController.saveTranslation);
router.get('/', requireAuth, translationController.getHistory);
router.delete('/:id', requireAuth, translationController.deleteTranslation);
router.delete('/', requireAuth, translationController.clearHistory);

module.exports = router;
