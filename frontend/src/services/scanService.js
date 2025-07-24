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

// Step 1: Process wound detection with bbox crop workflow
const processWoundDetection = async (scanId) => {
  try {
    console.log(`Starting wound detection with bbox crop for scan ${scanId}`);
    
    const response = await api.post(`/scans/${scanId}/process_wound_detection/`, {}, {
      timeout: 120000, // 2 minutes timeout for wound detection + bbox crop
    });
    
    console.log('✅ Wound detection with bbox crop completed successfully');
    console.log('Generated files:', {
      processed_image: response.data.processed_image,
      cropped_segmented_path: response.data.cropped_segmented_path,
      cropped_image_path: response.data.cropped_image_path,
      bbox_visualization_path: response.data.bbox_visualization_path
    });
    
    return response.data;
  } catch (error) {
    console.error('Error processing wound detection:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - wound detection processing is taking longer than expected');
    }
    throw error;
  }
};

// Step 2: Process depth analysis using ZoeDepth
const processDepthAnalysis = async (scanId) => {
  try {
    console.log(`Starting depth analysis for scan ${scanId}`);
    
    const response = await api.post(`/scans/${scanId}/process_depth_analysis/`, {}, {
      timeout: 300000, // 5 minutes timeout for ZoeDepth processing
    });
    
    console.log('✅ Depth analysis completed successfully');
    console.log('Depth results:', {
      depth_map_8bit: response.data.depth_map_8bit,
      depth_map_16bit: response.data.depth_map_16bit,
      volume_estimate: response.data.depth_metadata?.volume_estimate?.total_volume
    });
    
    return response.data;
  } catch (error) {
    console.error('Error processing depth analysis:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - ZoeDepth processing is taking longer than expected');
    }
    throw error;
  }
};

// Step 3: Process mesh generation with STL and preview
const processMeshGeneration = async (scanId, visualization_mode = 'balanced') => {
  try {
    console.log(`Starting mesh generation for scan ${scanId} with mode: ${visualization_mode}`);
    
    const response = await api.post(`/scans/${scanId}/process_mesh_generation/`, {
      visualization_mode
    }, {
      timeout: 180000, // 3 minutes timeout for mesh generation
    });
    
    console.log('✅ Mesh generation completed successfully');
    console.log('Mesh results:', {
      stl_file_url: response.data.stl_generation?.stl_file_url,
      preview_image_url: response.data.preview_generation?.preview_image_url,
      visualization_mode: response.data.stl_generation?.visualization_mode
    });
    
    return response.data;
  } catch (error) {
    console.error('Error processing mesh generation:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - mesh generation is taking longer than expected');
    }
    throw error;
  }
};

// Legacy method for backward compatibility (now calls the 3-step process)
const processComprehensiveScan = async (scanId) => {
  try {
    console.log(`Starting comprehensive scan processing for scan ${scanId}`);
    console.log('Pipeline: WoundDetector → ZoeDepth → MeshGenerator');
    
    // Step 1: Wound Detection
    const woundResults = await processWoundDetection(scanId);
    
    // Step 2: Depth Analysis  
    const depthResults = await processDepthAnalysis(scanId);
    
    // Step 3: Mesh Generation
    const meshResults = await processMeshGeneration(scanId);
    
    // Combine all results
    const combinedResults = {
      ...woundResults,
      ...depthResults,
      ...meshResults,
      processing_pipeline: ['WoundDetector', 'ZoeDepth', 'MeshGenerator'],
      scan_id: scanId
    };
    
    console.log('✅ Comprehensive scan processing completed successfully');
    return combinedResults;
    
  } catch (error) {
    console.error('Error processing comprehensive scan:', error);
    throw error;
  }
};

export const scanService = {
  getAllScans,
  getPatientScans,
  createScan,
  processWoundDetection,
  processDepthAnalysis,
  processMeshGeneration,
  processComprehensiveScan, // Legacy method
}; 