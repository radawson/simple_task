import axios from 'axios';
import { AuthService } from './auth.service';

// For development environment only
const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // Handle SSL verification only in development
  ...(isDev && {
    proxy: false,
    httpsAgent: false
  })
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getCurrentToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log in development
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

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message
    };
    
    // In development, log more details
    if (isDev) {
      console.error('API Error:', errorDetails);
    }
    return Promise.reject(error);
  }
);

export const ApiService = {
  // Tasks
  getTasks: (date) => api.get(`/tasks/date/${date}`),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  
  // Events
  getEvents: (date) => api.get(`/events/date/${date}`),
  createEvent: (event) => api.post('/events', event),
  updateEvent: (id, event) => api.put(`/events/${id}`, event),
  
  // Notes
  getNotes: (date) => api.get(`/notes/date/${date}`),
  createNote: (note) => api.post('/notes', note),
  updateNote: (id, note) => api.put(`/notes/${id}`, note),
};