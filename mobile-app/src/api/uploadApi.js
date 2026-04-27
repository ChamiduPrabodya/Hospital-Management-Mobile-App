import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/constants';

const uploadMultipart = async (path, formData) => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const uploadError = new Error(data?.message || 'Upload failed');
    uploadError.response = {
      status: response.status,
      data,
    };
    throw uploadError;
  }

  return { data };
};

export const uploadDoctorImageApi = (formData) => uploadMultipart('/upload/doctor-image', formData);

export const uploadUserProfileImageApi = (formData) => uploadMultipart('/upload/profile-image', formData);
