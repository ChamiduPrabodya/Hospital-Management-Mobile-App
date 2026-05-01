import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from './axios';
import { BASE_URL } from '../utils/constants';

export const getMedicalDocumentsApi = (patientId) => (
  patientId
    ? axios.get(`/medical-documents?patientId=${patientId}`)
    : axios.get('/medical-documents')
);

export const deleteMedicalDocumentApi = (id) => axios.delete(`/medical-documents/${id}`);

export const uploadMedicalDocumentApi = async (formData) => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${BASE_URL}/medical-documents`, {
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
    uploadError.response = { status: response.status, data };
    throw uploadError;
  }

  return { data };
};
