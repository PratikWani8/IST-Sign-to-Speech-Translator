const axios = require('axios');
const { AI_SERVICE_URL } = require('../config/env');

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getHealth = async () => {
  try {
    const response = await client.get('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'unavailable',
      model_loaded: false,
      error: error.message,
    };
  }
};

const getModelInfo = async () => {
  try {
    const response = await client.get('/model-info');
    return response.data;
  } catch (error) {
    throw new Error(`AI Service /model-info unreachable: ${error.message}`);
  }
};

const getVocabulary = async () => {
  try {
    const response = await client.get('/vocabulary');
    return response.data;
  } catch (error) {
    throw new Error(`AI Service /vocabulary unreachable: ${error.message}`);
  }
};

const predictFrame = async (payload) => {
  try {
    const response = await client.post('/predict', payload);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Inference error from AI microservice');
    }
    throw new Error(`Failed to reach AI service: ${error.message}`);
  }
};

const predictSequence = async (payload) => {
  try {
    const response = await client.post('/predict/sequence', payload);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || 'Sequence inference error from AI microservice');
    }
    throw new Error(`Failed to reach AI service: ${error.message}`);
  }
};

module.exports = {
  getHealth,
  getModelInfo,
  getVocabulary,
  predictFrame,
  predictSequence,
};
