// src/services/api.js
import axios from 'axios';
import { AuthService } from './auth.service';

const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (isDev) {
      console.log('Making request to:', config.baseURL + config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AuthService.logout();
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication required'));
    }
    return Promise.reject(error);
  }
);

export const ApiService = {
  // Tasks
  getTasks: (date) => api.get(`/tasks/date/${date}`),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),

  // Templates
  getTemplates: () => api.get('/templates'),
  createTemplate: (template) => api.post('/templates', template),
  updateTemplate: (id, template) => api.put(`/templates/${id}`, template),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),

  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: () => api.post('/auth/refresh'),
  
  // Events
  getEvents: (date) => api.get(`/events/date/${date}`),
  createEvent: (event) => api.post('/events', event),
  updateEvent: (id, event) => api.put(`/events/${id}`, event),
  
  // Notes
  getNotes: (date) => api.get(`/notes/date/${date}`),
  createNote: (note) => api.post('/notes', note),
  updateNote: (id, note) => api.put(`/notes/${id}`, note),
};