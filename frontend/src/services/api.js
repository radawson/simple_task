import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

export const getTasks = () => api.get('/tasks');
export const createTask = (task) => api.post('/tasks', task);