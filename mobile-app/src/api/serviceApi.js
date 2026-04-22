import axios from './axios';

export const getServicesApi = () => axios.get('/services');
export const getServiceByIdApi = (id) => axios.get(`/services/${id}`);
export const createServiceApi = (data) => axios.post('/services', data);
export const updateServiceApi = (id, data) => axios.put(`/services/${id}`, data);
export const deleteServiceApi = (id) => axios.delete(`/services/${id}`);