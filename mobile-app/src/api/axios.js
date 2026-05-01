import axios from 'axios';
import { BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
});

instance.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};
    const isFormData =
      (typeof FormData !== 'undefined' && config.data instanceof FormData) ||
      (config.data && typeof config.data === 'object' && typeof config.data.append === 'function');

    if (isFormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

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
    const status = error.response?.status;
    const requestUrl = error.response?.config?.url || error.config?.url || '';
    const normalizedUrl = String(requestUrl);
    const isLoginRequest = normalizedUrl === '/auth/login' || normalizedUrl.endsWith('/auth/login');

    if (status === 401 && !isLoginRequest) {
      console.warn('Axios 401 response:', requestUrl);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    }
    return Promise.reject(error);
  }
);

export default instance;
