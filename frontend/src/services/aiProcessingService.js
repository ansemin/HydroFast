import api from './api';

// AI Processing service methods
export const aiProcessingService = {
  // Process wound detection
  processWoundDetection: async (scanId) => {
    try {
      const response = await api.post(`/scans/${scanId}/wound-detection/`);
      return response.data;
    } catch (error) {
      console.error('Wound detection error:', error);
      throw error;
    }
  },

  // Process depth analysis
  processDepthAnalysis: async (scanId) => {
    try {
      const response = await api.post(`/scans/${scanId}/depth-analysis/`);
      return response.data;
    } catch (error) {
      console.error('Depth analysis error:', error);
      throw error;
    }
  },

  // Process mesh generation
  processMeshGeneration: async (scanId) => {
    try {
      const response = await api.post(`/scans/${scanId}/mesh-generation/`);
      return response.data;
    } catch (error) {
      console.error('Mesh generation error:', error);
      throw error;
    }
  },

  // Get AI model info
  getAIModels: async () => {
    try {
      const response = await api.get('/ai-models/');
      return response.data;
    } catch (error) {
      console.error('Get AI models error:', error);
      throw error;
    }
  },

  // Get processing status
  getProcessingStatus: async (scanId) => {
    try {
      const response = await api.get(`/scans/${scanId}/processing-status/`);
      return response.data;
    } catch (error) {
      console.error('Get processing status error:', error);
      throw error;
    }
  },

  // Get processed results
  getProcessedResults: async (scanId) => {
    try {
      const response = await api.get(`/scans/${scanId}/results/`);
      return response.data;
    } catch (error) {
      console.error('Get processed results error:', error);
      throw error;
    }
  },

  // Download processed files
  downloadProcessedFile: async (scanId, fileType) => {
    try {
      const response = await api.get(`/scans/${scanId}/download/${fileType}/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Download processed file error:', error);
      throw error;
    }
  },

  // Mock processing for demo purposes
  mockProcessing: {
    woundDetection: async (imageUri) => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        success: true,
        detected_wounds: [
          {
            x: 150,
            y: 200,
            width: 100,
            height: 80,
            confidence: 0.95,
            area: 8000 // in pixels
          }
        ],
        processed_image_url: imageUri // Return same image for demo
      };
    },

    depthAnalysis: async (imageUri) => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      return {
        success: true,
        depth_map_url: imageUri,
        volume_estimate: 2.5, // in cm³
        average_depth: 0.8, // in cm
        max_depth: 1.2 // in cm
      };
    },

    meshGeneration: async (imageUri) => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 4000));
      return {
        success: true,
        mesh_url: imageUri,
        stl_file_url: null, // Would be actual STL file URL
        mesh_quality: 'high',
        triangle_count: 15000
      };
    }
  }
};

export default aiProcessingService; 