import axios from 'axios';
import { BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Axios 401 response:', error.response.config?.url);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    }
    return Promise.reject(error);
  }
);

export default instance;
