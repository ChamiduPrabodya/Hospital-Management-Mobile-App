import axios from './axios';

export const getComplaintsApi = () => axios.get('/complaints');
export const getComplaintByIdApi = (id) => axios.get(`/complaints/${id}`);
export const createComplaintApi = (data) => axios.post('/complaints', data);
export const updateComplaintApi = (id, data) => axios.put(`/complaints/${id}`, data);
export const deleteComplaintApi = (id) => axios.delete(`/complaints/${id}`);
export const updateComplaintStatusApi = (id, status, adminReply) =>
  axios.patch(`/complaints/${id}/status`, { status, adminReply });