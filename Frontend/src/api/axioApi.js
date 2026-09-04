import axios from 'axios';

// Backend origin - used for API calls and for building profile picture URLs.
export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axioApi = axios.create({
  baseURL: `${SERVER_URL}/api`,
});

// Turns "/uploads/123.png" stored in Mongo into a full browser URL.
export const imageUrl = (path) => (path ? `${SERVER_URL}${path}` : '');

export const getToken = () => localStorage.getItem('token');

export const saveSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Every protected request carries the login token.
axioApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or missing token sends the user back to the login screen.
axioApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      if (window.location.pathname !== '/login') window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default axioApi;
