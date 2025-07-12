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
    console.log(`Starting comprehensive scan processing for scan ${scanId}`);
    console.log('Pipeline: WoundDetector → ZoeDepth → DepthAnalyzer');
    
    const response = await api.post(`/scans/${scanId}/process_scan/`, {}, {
      timeout: 300000, // 5 minutes timeout for AI processing (increased for ZoeDepth)
    });
    
    console.log('✅ Comprehensive scan processing completed successfully');
    
    // Log processing results
    const data = response.data;
    if (data.depth_metadata) {
      console.log('📊 Depth Analysis Results:');
      console.log(`   • Wound Severity: ${data.depth_metadata.wound_severity}`);
      console.log(`   • Volume Estimate: ${data.depth_metadata.volume_estimate?.total_volume || 'N/A'} cubic mm`);
      console.log(`   • Processing Confidence: ${(data.depth_metadata.processing_confidence * 100).toFixed(1)}%`);
      console.log(`   • Surface Area: ${data.depth_metadata.surface_area} mm²`);
      console.log(`   • Wound Mask Extracted: ${data.depth_metadata.wound_mask_extracted ? 'Yes' : 'No'}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error processing scan:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - ZoeDepth processing is taking longer than expected');
    }
    throw error;
  }
};

// New method specifically for depth analysis (if needed separately)
const processDepthAnalysis = async (scanId) => {
  try {
    console.log(`Starting depth analysis for scan ${scanId}`);
    
    const response = await api.post(`/scans/${scanId}/process_scan/`, {}, {
      timeout: 300000, // 5 minutes timeout for ZoeDepth processing
    });
    
    console.log('✅ Depth analysis completed successfully');
    return response.data;
  } catch (error) {
    console.error('Error processing depth analysis:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - ZoeDepth processing is taking longer than expected');
    }
    throw error;
  }
};

export const scanService = {
  getAllScans,
  getPatientScans,
  createScan,
  processWoundDetection,
  processDepthAnalysis,
}; 