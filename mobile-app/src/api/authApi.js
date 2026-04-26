import axios from './axios';

export const loginApi = (email, password) => axios.post('/auth/login', { email, password });
export const registerApi = (name, email, password) => axios.post('/auth/register', { name, email, password });
export const requestPasswordResetOtpApi = (email) => axios.post('/auth/forgot-password/request-otp', { email });
export const resetPasswordWithOtpApi = (email, otp, password) => axios.post('/auth/forgot-password/reset', { email, otp, password });
export const getMeApi = () => axios.get('/auth/me');
