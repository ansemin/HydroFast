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
    const response = await api.get(`/scans/?patient=${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient scans:', error);
    throw error;
  }
};

const createScan = async (formData) => {
  try {
    const response = await api.post('/scans/upload_image/', formData, {
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

const processWoundDetection = async (scanId) => {
  try {
    const response = await api.post(`/scans/${scanId}/process_scan/`);
    return response.data;
  } catch (error) {
    console.error('Error processing wound detection:', error);
    throw error;
  }
};

export const scanService = {
  getAllScans,
  getPatientScans,
  createScan,
  processWoundDetection,
}; 