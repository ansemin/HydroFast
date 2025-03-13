import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  // For web browser
  if (Platform.OS === 'web') {
    // Make sure window and location are defined
    if (typeof window !== 'undefined' && window.location) {
      // For web development, use localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://127.0.0.1:8000/api';
      }
      // If deployed to a different domain
      return `${window.location.protocol}//${window.location.host}/api`;
    }
    return 'http://127.0.0.1:8000/api';
  }
  
  // For mobile (iOS/Android)
  // Use your local network IP address instead of localhost
  return 'http://172.30.1.54:8000/api';  // Use the WiFi IP the user mentioned
};

const API_URL = getBaseUrl();

console.log('Using API URL:', API_URL); // Debug log to see which URL is being used

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add a timeout of 10 seconds
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  async (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`); // Debug log
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Authentication methods
export const login = async (username, password) => {
  try {
    console.log(`Attempting to login with username: ${username}`);
    const response = await api.post('/login/', { username, password });
    console.log('Login successful:', response.data);
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await api.post('/register/', { username, email, password });
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getUserInfo = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
    const response = await api.get('/user-info/');
    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Get user info error:', error);
    throw error;
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

export default api;
