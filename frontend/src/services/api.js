import axios from 'axios';
import { AuthService } from './auth.service';

const api = axios.create({
  baseURL: '/api'
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getCurrentToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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