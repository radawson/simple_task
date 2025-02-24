// src/services/auth.service.js
import { ApiService } from './api';
import authConfig from '../config/auth.config';

const API_URL = '/auth';

export const AuthService = {
  async login(username, password) {
    const response = await ApiService.login({ username, password });
    this.handleAuthResponse(response);
    return response.data;
  },

  loginWithSSO() {
    if (!authConfig.enableSSO) {
      throw new Error('SSO is not enabled');
    }
    window.location.href = `${API_URL}/sso/login`;
  },

  async handleSSOCallback(code, state) {
    const response = await ApiService.handleSSOCallback(code, state);
    this.handleAuthResponse(response);
    return response.data;
  },

  handleAuthResponse(response) {
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = `${API_URL}/sso/logout`;
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getCurrentToken() {
    return localStorage.getItem('token');
  },

  // Add alias for consistency with api.js
  getToken() {
    return this.getCurrentToken();
  }
  
};