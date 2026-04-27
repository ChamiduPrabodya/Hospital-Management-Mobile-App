import axios from './axios';

export const uploadDoctorImageApi = (formData) => axios.post('/upload/doctor-image', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const uploadUserProfileImageApi = (formData) => axios.post('/upload/profile-image', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
