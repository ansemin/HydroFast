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

const getScans = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/scans/?${queryParams}` : '/scans/';
    const response = await api.get(url);
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

// GRANULAR 1.1: Segments, finds bbox, crops original image
const processInitialCrop = async (scanId) => {
  try {
    console.log(`🚀 [Frontend] Step 1.1: Starting initial crop for scan ${scanId}`);
    const response = await api.post(`/ai-processing/${scanId}/process_initial_crop/`, {}, {
      timeout: 180000, // 3 minutes
    });
    console.log('✅ [Frontend] Step 1.1 Initial crop successful.');
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error during initial crop:', error);
    throw error;
  }
};

// GRANULAR 1.2: Crops the segmented image using saved bbox
const processCroppedSegmentation = async (scanId) => {
  try {
    console.log(`🚀 [Frontend] Step 1.2: Starting cropped segmentation for scan ${scanId}`);
    const response = await api.post(`/ai-processing/${scanId}/process_cropped_segmentation/`, {}, {
      timeout: 60000, // 1 minute
    });
    console.log('✅ [Frontend] Step 1.2 Cropped segmentation successful.');
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error during cropped segmentation:', error);
    throw error;
  }
};

// GRANULAR 3: ZoeDepth processing on cropped original
const processDepthAnalysis = async (scanId) => {
  try {
    console.log(`🚀 [Frontend] Step 3: Starting ZoeDepth analysis for scan ${scanId}`);
    const response = await api.post(`/ai-processing/${scanId}/process_depth_analysis/`, {}, {
      timeout: 300000, // 5 minutes
    });
    console.log('✅ [Frontend] Step 3 ZoeDepth analysis successful.');
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error during depth analysis:', error);
    throw error;
  }
};

// GRANULAR 4: Mesh and preview generation
const processMeshGeneration = async (scanId, visualization_mode = 'balanced') => {
  try {
    console.log(`🚀 [Frontend] Step 4: Starting mesh generation for scan ${scanId}`);
    const response = await api.post(`/ai-processing/${scanId}/process_mesh_generation/`, {
      visualization_mode
    }, {
      timeout: 180000, // 3 minutes
    });
    console.log('✅ [Frontend] Step 4 Mesh generation successful.');
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error during mesh generation:', error);
    throw error;
  }
};

export const scanService = {
  getAllScans,
  getScans,
  getPatientScans,
  createScan,
  processInitialCrop,
  processCroppedSegmentation,
  processDepthAnalysis,
  processMeshGeneration,
}; 