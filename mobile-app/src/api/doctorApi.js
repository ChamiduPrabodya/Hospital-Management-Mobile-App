import axios from './axios';

export const getDoctorsApi = () => axios.get('/doctors');
export const getDoctorByIdApi = (id) => axios.get(`/doctors/${id}`);
export const getMyPatientsApi = () => axios.get('/doctors/my-patients');
export const getPatientHistoryApi = (patientId) => axios.get(`/doctors/patients/${patientId}/history`);
export const createDoctorApi = (data) => axios.post('/doctors', data);
export const updateDoctorApi = (id, data) => axios.put(`/doctors/${id}`, data);
export const deleteDoctorApi = (id) => axios.delete(`/doctors/${id}`);
