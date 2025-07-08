import api from './api';

const getAllPatients = async () => {
  try {
    const response = await api.get('/patients/');
    return response.data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

const getPatient = async (patientId) => {
  try {
    const response = await api.get(`/patients/${patientId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

const createPatient = async (patientData) => {
  try {
    const response = await api.post('/patients/', patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

const updatePatient = async (patientId, patientData) => {
  try {
    const response = await api.put(`/patients/${patientId}/`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

const deletePatient = async (patientId) => {
  try {
    await api.delete(`/patients/${patientId}/`);
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

export const patientService = {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
}; 