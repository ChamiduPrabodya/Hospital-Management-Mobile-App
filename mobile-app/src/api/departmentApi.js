import axios from './axios';

export const getAllDepartments = async () => {
  const response = await axios.get('/departments');
  return response.data;
};

export const createDepartmentApi = async (data) => {
  const response = await axios.post('/departments', data);
  return response.data;
};

export const updateDepartmentApi = async (id, data) => {
  const response = await axios.put(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartmentApi = async (id) => {
  const response = await axios.delete(`/departments/${id}`);
  return response.data;
};
