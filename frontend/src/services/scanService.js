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

// NEW GRANULAR: Step 1 - YOLO wound segmentation only
const processWoundSegmentation = async (scanId) => {
  try {
    console.log(`🤖 [Frontend] Starting YOLO wound segmentation for scan ${scanId}`);
    
    const response = await api.post(`/scans/${scanId}/process_wound_segmentation/`, {}, {
      timeout: 60000, // 1 minute timeout for YOLO segmentation
    });
    
    console.log('✅ [Frontend] YOLO wound segmentation completed successfully');
    console.log('🎯 [Frontend] Generated segmented image:', response.data.processed_image);
    
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error processing wound segmentation:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ [Frontend] Request timed out - YOLO segmentation taking longer than expected');
    }
    throw error;
  }
};

// NEW GRANULAR: Step 2 - Bbox detection and cropping only
const processBboxDetection = async (scanId) => {
  try {
    console.log(`📦 [Frontend] Starting bbox detection and cropping for scan ${scanId}`);
    
    const response = await api.post(`/scans/${scanId}/process_bbox_detection/`, {}, {
      timeout: 60000, // 1 minute timeout for bbox detection
    });
    
    console.log('✅ [Frontend] Bbox detection and cropping completed successfully');
    console.log('🔧 [Frontend] Generated files:', {
      cropped_image_path: response.data.cropped_image_path,
      cropped_segmented_path: response.data.cropped_segmented_path,
      bbox_visualization_path: response.data.bbox_visualization_path
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error processing bbox detection:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ [Frontend] Request timed out - bbox detection taking longer than expected');
    }
    throw error;
  }
};

// SIMPLIFIED: Step 3 - ZoeDepth processing only
const processDepthAnalysis = async (scanId) => {
  try {
    console.log(`🔍 [Frontend] Starting ZoeDepth analysis for scan ${scanId}`);
    
    const response = await api.post(`/scans/${scanId}/process_depth_analysis/`, {}, {
      timeout: 300000, // 5 minutes timeout for ZoeDepth processing
    });
    
    console.log('✅ [Frontend] ZoeDepth analysis completed successfully');
    console.log('📊 [Frontend] Depth results:', {
      depth_map_8bit: response.data.depth_map_8bit,
      depth_map_16bit: response.data.depth_map_16bit,
      volume_estimate: response.data.depth_metadata?.volume_estimate?.total_volume
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error processing depth analysis:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ [Frontend] Request timed out - ZoeDepth processing taking longer than expected');
    }
    throw error;
  }
};

// SIMPLIFIED: Step 4 - Mesh and preview generation only
const processMeshGeneration = async (scanId, visualization_mode = 'balanced') => {
  try {
    console.log(`🏗️ [Frontend] Starting mesh generation for scan ${scanId} with mode: ${visualization_mode}`);
    
    const response = await api.post(`/scans/${scanId}/process_mesh_generation/`, {
      visualization_mode
    }, {
      timeout: 180000, // 3 minutes timeout for mesh generation
    });
    
    console.log('✅ [Frontend] Mesh generation completed successfully');
    console.log('📁 [Frontend] Mesh results:', {
      stl_file_url: response.data.stl_generation?.stl_file_url,
      preview_image_url: response.data.preview_generation?.preview_image_url,
      visualization_mode: response.data.stl_generation?.visualization_mode
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ [Frontend] Error processing mesh generation:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ [Frontend] Request timed out - mesh generation taking longer than expected');
    }
    throw error;
  }
};

export const scanService = {
  getAllScans,
  getPatientScans,
  createScan,
  processWoundSegmentation, // NEW: YOLO segmentation only
  processBboxDetection,     // NEW: Bbox detection and cropping only
  processDepthAnalysis,     // SIMPLIFIED: ZoeDepth only
  processMeshGeneration,    // SIMPLIFIED: Mesh and preview only
}; 