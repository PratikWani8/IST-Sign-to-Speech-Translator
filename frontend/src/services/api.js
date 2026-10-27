import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('isl_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on unauthorized if it was invalid
      const currentToken = localStorage.getItem('isl_auth_token');
      if (currentToken && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('isl_auth_token');
        localStorage.removeItem('isl_user_data');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateMe: async (updates) => {
    const res = await api.put('/auth/me', updates);
    return res.data;
  },
};

export const translationService = {
  saveTranslation: async (data) => {
    const res = await api.post('/translations', data);
    return res.data;
  },
  getHistory: async (params = {}) => {
    const res = await api.get('/translations', { params });
    return res.data;
  },
  deleteTranslation: async (id) => {
    const res = await api.delete(`/translations/${id}`);
    return res.data;
  },
  clearHistory: async () => {
    const res = await api.delete('/translations');
    return res.data;
  },
};

export const vocabularyService = {
  getVocabulary: async (category) => {
    const res = await api.get('/vocabulary', { params: { category } });
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get('/vocabulary/categories');
    return res.data;
  },
};

export const aiService = {
  predictFrame: async (imageBase64, category = null, threshold = null) => {
    const res = await api.post('/ai/predict', {
      image_base64: imageBase64,
      category,
      confidence_threshold: threshold,
    });
    return res.data;
  },
  predictSequence: async (framesBase64, fps = 10, minStabilityCount = 2) => {
    const res = await api.post('/ai/predict/sequence', {
      frames_base64: framesBase64,
      fps,
      min_stability_count: minStabilityCount,
    });
    return res.data;
  },
  getModelInfo: async () => {
    const res = await api.get('/ai/model-info');
    return res.data;
  },
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};

export default api;
