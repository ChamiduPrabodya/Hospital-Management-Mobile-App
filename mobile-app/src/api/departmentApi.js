import axios from './axios';

export const getAllDepartments = () => axios.get('/departments');
export const createDepartmentApi = (data) => axios.post('/departments', data);
export const updateDepartmentApi = (id, data) => axios.put(`/departments/${id}`, data);
export const deleteDepartmentApi = (id) => axios.delete(`/departments/${id}`);
