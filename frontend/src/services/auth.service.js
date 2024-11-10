import axios from 'axios';

const API_URL = '/auth';

export const AuthService = {
  async login(email, password) {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    this.handleAuthResponse(response);
    return response.data;
  },

  async loginWithOIDC() {
    window.location.href = `${API_URL}/sso/login`;
  },

  handleAuthResponse(response) {
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getCurrentToken() {
    return localStorage.getItem('token');
  }
};