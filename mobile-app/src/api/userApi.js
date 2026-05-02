import axios from './axios';

export const getUsersApi = () => axios.get('/users');
export const getUserByIdApi = (id) => axios.get(`/users/${id}`);
export const updateUserApi = (id, data) => axios.put(`/users/${id}`, data);
export const deleteUserApi = (id, reason) => axios.delete(`/users/${id}`, { data: { reason } });
