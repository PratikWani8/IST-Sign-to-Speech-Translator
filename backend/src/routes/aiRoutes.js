const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/predict', aiController.predict);
router.post('/predict/sequence', aiController.predictSequence);
router.get('/model-info', aiController.getModelInfo);

module.exports = router;
