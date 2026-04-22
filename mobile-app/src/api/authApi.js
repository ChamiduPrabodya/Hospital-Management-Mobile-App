import axios from './axios';

export const loginApi = (email, password) => axios.post('/auth/login', { email, password });
export const registerApi = (name, email, password) => axios.post('/auth/register', { name, email, password });
export const getMeApi = () => axios.get('/auth/me');