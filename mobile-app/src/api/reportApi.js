import axios from './axios';

export const generateReportApi = (data) => axios.post('/reports/generate', data);
export const getReportsApi = () => axios.get('/reports');
export const getReportByIdApi = (id) => axios.get(`/reports/${id}`);
export const deleteReportApi = (id) => axios.delete(`/reports/${id}`);