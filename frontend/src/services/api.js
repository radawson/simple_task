import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const getTodayData = () => api.get('/');
export const getDateData = (date) => api.get(`/date/${date}`);
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data);
export const updateEvent = (id, data) => api.patch(`/events/${id}`, data);