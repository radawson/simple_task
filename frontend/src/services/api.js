//src/services/api.js
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
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: () => api.post('/auth/refresh'),

  // Events
  createEvent: (event) => api.post('/events', event),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  getEvent: (id) => api.get(`/events/${id}`),
  getEvents: (date) => api.get(`/events/date/${date}`),
  getEventsByRange: (start, end) => api.get(`/events/range/${start}/${end}`),
  listEvents: (params) => api.get('/events', { params }),
  updateEvent: (id, event) => api.patch(`/events/${id}`, event),

  // Notes
  createNote: (note) => api.post('/notes', note),
  deleteNote: (id) => api.delete(`/notes/${id}`),
  getNote: (id) => api.get(`/notes/${id}`),
  getNotes: (date) => api.get(`/notes/date/${date}`),
  listNotes: (params) => axios.get('/api/notes', { params }),
  updateNote: (id, note) => api.patch(`/notes/${id}`, note),

  // Persons
  createPerson: (person) => api.post('/persons', person),
  deletePerson: (id) => api.delete(`/persons/${id}`),
  getPerson: (id) => api.get(`/persons/${id}`),
  listPersons: (params) => api.get('/persons', { params }),
  updatePerson: (id, person) => api.patch(`/persons/${id}`, person),

  // Tasks
  createTask: (task) => api.post('/tasks', task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getTask: (id) => api.get(`/tasks/${id}`),
  getTasks: (date) => api.get(`/tasks/date/${date}`),
  listTasks: (params) => api.get('/tasks', { params }),
  toggleTaskCompletion: (taskId) => api.patch(`/tasks/completed/${taskId}`),
  updateTask: (id, task) => api.patch(`/tasks/${id}`, task),

  // Templates
  createTemplate: (template) => api.post('/templates', template),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  getTemplate: (id) => api.get(`/templates/${id}`),
  getTemplates: () => api.get('/templates'),
  listTemplates: (params) => api.get('/templates', { params }), // redundant, but keeps the pattern
  updateTemplate: (id, template) => api.patch(`/templates/${id}`, template),

  // Calendar Import 
  importCalendar: (calendar) => api.post('/events/import', calendar),
  exportCalendar: (id) => api.get(`/events/export/${id}`),
};