import api from './api';

// AI Processing service methods
export const aiProcessingService = {
  // Process comprehensive scan (wound detection + depth analysis)
  processComprehensiveScan: async (scanId) => {
    try {
      console.log(`Starting comprehensive AI processing for scan ${scanId}`);
      const response = await api.post(`/scans/${scanId}/process_scan/`, {}, {
        timeout: 180000, // 3 minutes timeout for ZoeDepth processing
      });
      
      console.log('✅ Comprehensive AI processing completed');
      return response.data;
    } catch (error) {
      console.error('Comprehensive scan processing error:', error);
      throw error;
    }
  },

  // Process wound detection (alias for comprehensive scan)
  processWoundDetection: async (scanId) => {
    try {
      const response = await api.post(`/scans/${scanId}/process_scan/`, {}, {
        timeout: 180000, // 3 minutes timeout for ZoeDepth processing
      });
      return response.data;
    } catch (error) {
      console.error('Wound detection error:', error);
      throw error;
    }
  },

  // Process depth analysis (alias for comprehensive scan)
  processDepthAnalysis: async (scanId) => {
    try {
      const response = await api.post(`/scans/${scanId}/process_scan/`, {}, {
        timeout: 180000, // 3 minutes timeout for ZoeDepth processing
      });
      return response.data;
    } catch (error) {
      console.error('Depth analysis error:', error);
      throw error;
    }
  },

  // Process mesh generation (placeholder for future implementation)
  processMeshGeneration: async (scanId) => {
    try {
      console.log(`Mesh generation not yet implemented for scan ${scanId}`);
      // For now, return mock data
      return {
        status: 'Not implemented',
        message: 'Mesh generation will be implemented in future phases'
      };
    } catch (error) {
      console.error('Mesh generation error:', error);
      throw error;
    }
  },

  // Get AI model info
  getAIModels: async () => {
    try {
      const response = await api.get('/aimodels/');
      return response.data;
    } catch (error) {
      console.error('Get AI models error:', error);
      throw error;
    }
  },

  // Utility methods for depth processing results
  extractDepthMapUrls: (processingResults) => {
    try {
      return {
        depth_8bit: processingResults.depth_map_8bit,
        depth_16bit: processingResults.depth_map_16bit,
        segmented_image: processingResults.processed_image
      };
    } catch (error) {
      console.error('Error extracting depth map URLs:', error);
      return null;
    }
  },

  extractDepthMetadata: (processingResults) => {
    try {
      const metadata = processingResults.depth_metadata;
      if (!metadata) return null;
      
      return {
        woundSeverity: metadata.wound_severity,
        volumeEstimate: metadata.volume_estimate?.total_volume || 0,
        volumeConfidence: metadata.volume_estimate?.confidence || 0,
        processingConfidence: metadata.processing_confidence || 0,
        surfaceArea: metadata.surface_area || 0,
        depthStats: metadata.depth_statistics,
        woundMaskExtracted: metadata.wound_mask_extracted,
        analysisMethod: metadata.analysis_method,
        processingTimestamp: metadata.timestamp,
        units: metadata.units
      };
    } catch (error) {
      console.error('Error extracting depth metadata:', error);
      return null;
    }
  },

  formatDepthStatistics: (depthStats) => {
    try {
      if (!depthStats) return null;
      
      return {
        maxDepth: depthStats.max_depth ? depthStats.max_depth.toFixed(3) : 'N/A',
        meanDepth: depthStats.mean_depth ? depthStats.mean_depth.toFixed(3) : 'N/A',
        minDepth: depthStats.min_depth ? depthStats.min_depth.toFixed(3) : 'N/A',
        stdDepth: depthStats.std_depth ? depthStats.std_depth.toFixed(3) : 'N/A',
        medianDepth: depthStats.median_depth ? depthStats.median_depth.toFixed(3) : 'N/A',
        validPixelCount: depthStats.valid_pixel_count || 0
      };
    } catch (error) {
      console.error('Error formatting depth statistics:', error);
      return null;
    }
  },

  // Download depth maps
  downloadDepthMap: async (depthMapUrl, filename) => {
    try {
      const response = await api.get(depthMapUrl, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading depth map:', error);
      throw error;
    }
  },

  // Get processing status (placeholder for future implementation)
  getProcessingStatus: async (scanId) => {
    try {
      console.log(`Getting processing status for scan ${scanId}`);
      // For now, return mock status
      return {
        status: 'completed',
        message: 'Processing completed successfully'
      };
    } catch (error) {
      console.error('Get processing status error:', error);
      throw error;
    }
  },

  // Mock processing for demo purposes
  mockProcessing: {
    comprehensiveScan: async (imageUri) => {
      // Simulate processing time for comprehensive scan
      await new Promise(resolve => setTimeout(resolve, 5000));
      return {
        status: 'Processing complete',
        processed_image: imageUri,
        depth_map_8bit: imageUri, // Mock depth map URL
        depth_map_16bit: imageUri, // Mock depth map URL
        depth_metadata: {
          depth_statistics: {
            max_depth: 0.85,
            mean_depth: 0.32,
            min_depth: 0.05,
            std_depth: 0.18,
            median_depth: 0.28,
            valid_pixel_count: 15420
          },
          volume_estimate: {
            total_volume: 1250.5,
            confidence: 0.82,
            method: 'ZoeDepth_monocular'
          },
          wound_severity: 'moderate',
          processing_confidence: 0.78,
          surface_area: 245.6,
          wound_mask_extracted: true,
          analysis_method: 'ZoeDepth_monocular',
          processor: 'DepthAnalyzer',
          timestamp: new Date().toISOString(),
          units: {
            depth: 'normalized_units',
            volume: 'cubic_mm',
            area: 'square_mm'
          }
        },
        processing_pipeline: ['WoundDetector', 'ZoeDepth', 'DepthAnalyzer'],
        scan_id: 'mock_scan_id'
      };
    },

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