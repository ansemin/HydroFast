import api from './api';

const getAllScans = async () => {
  try {
    const response = await api.get('/scans/');
    return response.data;
  } catch (error) {
    console.error('Error fetching scans:', error);
    throw error;
  }
};

const getPatientScans = async (patientId) => {
  try {
    const response = await api.get(`/patients/${patientId}/scans/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient scans:', error);
    throw error;
  }
};

const createScan = async (formData) => {
  try {
    const response = await api.post('/scans/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating scan:', error);
    throw error;
  }
};

export const scanService = {
  getAllScans,
  getPatientScans,
  createScan,
}; 