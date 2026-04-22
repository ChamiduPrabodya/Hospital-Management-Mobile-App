import axios from './axios';

export const uploadDoctorImageApi = (formData) => axios.post('/upload/doctor-image', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});