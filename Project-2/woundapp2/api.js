
import axios from 'axios';

const api = axios.create({
  // Using your Wi-Fi IP address instead of localhost/127.0.0.1
  baseURL: 'http://172.30.1.87:8000/api', // Updated to your actual IP address
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
