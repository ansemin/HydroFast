import api from './api';

const getAllPatients = async () => {
  console.log('[PatientService] 📋 Fetching all patients from server...');
  const startTime = Date.now();
  
  try {
    const response = await api.get('/patients/');
    const duration = Date.now() - startTime;
    console.log(`[PatientService] ✅ Successfully fetched ${response.data.length} patients (took ${duration}ms)`);
    
    if (response.data.length > 0) {
      console.log(`[PatientService] First patient: "${response.data[0].first_name} ${response.data[0].last_name}" (ID: ${response.data[0].id})`);
    }
    
    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PatientService] ❌ Failed to fetch patients after ${duration}ms:`, error);
    
    if (error.response) {
      console.error(`[PatientService] Server responded with status ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[PatientService] Network error - no response received');
    } else {
      console.error('[PatientService] Request setup error:', error.message);
    }
    
    throw error;
  }
};

const getPatient = async (patientId) => {
  console.log(`[PatientService] 👤 Fetching patient details for ID: ${patientId}`);
  const startTime = Date.now();
  
  try {
    const response = await api.get(`/patients/${patientId}/`);
    const duration = Date.now() - startTime;
    console.log(`[PatientService] ✅ Successfully fetched patient "${response.data.first_name} ${response.data.last_name}" (took ${duration}ms)`);
    console.log(`[PatientService] Patient details:`, {
      id: response.data.id,
      nric: response.data.nric,
      contact: response.data.contact_no || 'None'
    });
    
    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PatientService] ❌ Failed to fetch patient ${patientId} after ${duration}ms:`, error);
    
    if (error.response) {
      console.error(`[PatientService] Server responded with status ${error.response.status}:`, error.response.data);
      
      if (error.response.status === 404) {
        console.error('[PatientService] Patient not found - may have been deleted');
      } else if (error.response.status === 403) {
        console.error('[PatientService] Permission denied - user may not have access');
      }
    } else if (error.request) {
      console.error('[PatientService] Network error - no response received');
    } else {
      console.error('[PatientService] Request setup error:', error.message);
    }
    
    throw error;
  }
};

const createPatient = async (patientData) => {
  console.log(`[PatientService] 🆕 Creating new patient: "${patientData.first_name} ${patientData.last_name}"`);
  console.log('[PatientService] Patient data:', { 
    nric: patientData.nric, 
    contact: patientData.contact_no || 'None',
    hasOptionalFields: !!(patientData.date_of_birth || patientData.details)
  });
  
  const startTime = Date.now();
  
  try {
    const response = await api.post('/patients/', patientData);
    const duration = Date.now() - startTime;
    console.log(`[PatientService] ✅ Patient created successfully! ID: ${response.data.id} (took ${duration}ms)`);
    console.log(`[PatientService] Created patient details:`, {
      id: response.data.id,
      name: `${response.data.first_name} ${response.data.last_name}`,
      nric: response.data.nric
    });
    
    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PatientService] ❌ Failed to create patient "${patientData.first_name} ${patientData.last_name}" after ${duration}ms:`, error);
    
    if (error.response) {
      console.error(`[PatientService] Server validation failed (status ${error.response.status}):`, error.response.data);
      
      // Log specific validation errors
      if (error.response.data && typeof error.response.data === 'object') {
        Object.entries(error.response.data).forEach(([field, messages]) => {
          console.error(`[PatientService] Validation error for "${field}":`, messages);
        });
      }
    } else if (error.request) {
      console.error('[PatientService] Network error during patient creation - no response received');
    } else {
      console.error('[PatientService] Request setup error:', error.message);
    }
    
    throw error;
  }
};

const updatePatient = async (patientId, patientData) => {
  console.log(`[PatientService] ✏️ Updating patient ID ${patientId}: "${patientData.first_name} ${patientData.last_name}"`);
  console.log('[PatientService] Updated fields:', Object.keys(patientData).filter(key => patientData[key] !== null && patientData[key] !== ''));
  
  const startTime = Date.now();
  
  try {
    const response = await api.put(`/patients/${patientId}/`, patientData);
    const duration = Date.now() - startTime;
    console.log(`[PatientService] ✅ Patient ${patientId} updated successfully! (took ${duration}ms)`);
    console.log(`[PatientService] Updated patient:`, {
      id: response.data.id,
      name: `${response.data.first_name} ${response.data.last_name}`,
      nric: response.data.nric
    });
    
    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PatientService] ❌ Failed to update patient ${patientId} after ${duration}ms:`, error);
    
    if (error.response) {
      console.error(`[PatientService] Server error during update (status ${error.response.status}):`, error.response.data);
      
      if (error.response.status === 404) {
        console.error('[PatientService] Patient not found - may have been deleted');
      } else if (error.response.status === 403) {
        console.error('[PatientService] Permission denied - user may not have edit rights');
      }
    } else if (error.request) {
      console.error('[PatientService] Network error during patient update - no response received');
    } else {
      console.error('[PatientService] Request setup error:', error.message);
    }
    
    throw error;
  }
};

const deletePatient = async (patientId) => {
  console.log(`[PatientService] 🗑️ Deleting patient ID: ${patientId}`);
  const startTime = Date.now();
  
  try {
    await api.delete(`/patients/${patientId}/`);
    const duration = Date.now() - startTime;
    console.log(`[PatientService] ✅ Patient ${patientId} deleted successfully! (took ${duration}ms)`);
    
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PatientService] ❌ Failed to delete patient ${patientId} after ${duration}ms:`, error);
    
    if (error.response) {
      console.error(`[PatientService] Server error during deletion (status ${error.response.status}):`, error.response.data);
      
      if (error.response.status === 404) {
        console.error('[PatientService] Patient not found - may have been already deleted');
      } else if (error.response.status === 403) {
        console.error('[PatientService] Permission denied - user may not have delete rights');
      }
    } else if (error.request) {
      console.error('[PatientService] Network error during patient deletion - no response received');
    } else {
      console.error('[PatientService] Request setup error:', error.message);
    }
    
    throw error;
  }
};

export const patientService = {
  getAllPatients,
  getPatients: getAllPatients, // Alias for compatibility
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
}; 