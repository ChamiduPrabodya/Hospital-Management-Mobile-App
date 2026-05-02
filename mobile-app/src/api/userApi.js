import axios from './axios';

export const getUsersApi = (params) => axios.get('/users', { params });
export const getUserByIdApi = (id) => axios.get(`/users/${id}`);
export const updateUserApi = (id, data) => axios.put(`/users/${id}`, data);
export const deleteUserApi = (id, reason) => axios.delete(`/users/${id}`, { data: { reason } });
export const permanentlyDeleteUserApi = (id) => axios.delete(`/users/${id}/permanent`);
export const reactivateUserApi = (id) => axios.patch(`/users/${id}/reactivate`);
