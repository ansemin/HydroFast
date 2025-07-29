import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@env';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  // If API_BASE_URL is defined in .env, construct the full URL
  if (API_BASE_URL) {
    return `http://${API_BASE_URL}:8000/api`;
  }
  
  // Fallback to previous logic if .env is not configured
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
  
  // For mobile (iOS/Android) - fallback if .env is not configured
  return 'http://127.0.0.1:8000/api';
};

const API_URL = getBaseUrl();

console.log('Using API URL:', API_URL); // Debug log to see which URL is being used

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased timeout to 60 seconds for AI processing
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  async (config) => {
    console.log(`🚀 Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
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
    console.log(`✅ Response received: ${response.status} for ${response.config.method.toUpperCase()} ${response.config.url}`);
    
    // Only log response data for small responses or specific endpoints
    if (response.config.url?.includes('/patients/') && response.config.method === 'get' && !response.config.url.match(/\/patients\/\d+\/$/)) {
      // For GET /patients/ (list all patients), log summary instead of full data
      if (Array.isArray(response.data)) {
        console.log(`📊 Fetched ${response.data.length} patients from server`);
      }
    } else if (response.data && typeof response.data === 'object' && Object.keys(response.data).length < 10) {
      // Log small response objects (like single patient, auth tokens, etc.)
      console.log('📦 Response data:', response.data);
    }
    
    return response;
  },
  (error) => {
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    };
    
    console.error('🚨 API Error Details:', errorDetails);
    
    // Log specific error types
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timed out - this usually happens during AI processing');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - check your connection and server status');
    } else if (error.response?.status >= 500) {
      console.error('🔧 Server error - check backend logs');
    }
    
    return Promise.reject(error);
  }
);

export default api; 