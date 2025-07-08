import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Authentication methods
const login = async (username, password) => {
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

const register = async (username, email, password) => {
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

const logout = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

const getUserInfo = async () => {
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

const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

export const authService = {
  login,
  register,
  logout,
  getUserInfo,
  isAuthenticated,
}; 