import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const submitText = async (data) => {
  const response = await api.post('/submit/', data);
  return response.data;
};

export const submitVoice = async (formData) => {
  const response = await api.post('/submit/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitPhoto = async (formData) => {
  const response = await api.post('/submit/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getSubmissions = async (page = 1, pageSize = 20) => {
  const response = await api.get('/submit/', { params: { page, page_size: pageSize } });
  return response.data;
};

export const getSubmission = async (id) => {
  const response = await api.get(`/submit/${id}`);
  return response.data;
};

export const getThemes = async () => {
  const response = await api.get('/analysis/themes');
  return response.data;
};

export const getHotspots = async () => {
  const response = await api.get('/analysis/hotspots');
  return response.data;
};

export const getRanking = async () => {
  const response = await api.get('/analysis/ranking');
  return response.data;
};

export const getEvidence = async (category) => {
  const response = await api.get(`/analysis/evidence/${category}`);
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('/analysis/dashboard');
  return response.data;
};

export const getPublicDashboard = async () => {
  const response = await api.get('/analysis/public-dashboard');
  return response.data;
};

export default api;
