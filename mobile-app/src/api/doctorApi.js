import axios from './axios';

export const getDoctorsApi = () => axios.get('/doctors');
export const getDoctorByIdApi = (id) => axios.get(`/doctors/${id}`);
export const createDoctorApi = (data) => axios.post('/doctors', data);
export const updateDoctorApi = (id, data) => axios.put(`/doctors/${id}`, data);
export const deleteDoctorApi = (id) => axios.delete(`/doctors/${id}`);