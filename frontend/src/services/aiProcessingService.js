import api from './api';

// AI Processing service methods
export const aiProcessingService = {
  // Step 1: Process wound detection with bbox crop workflow
  processWoundDetection: async (scanId) => {
    try {
      console.log(`Starting wound detection with bbox crop for scan ${scanId}`);
      const response = await api.post(`/scans/${scanId}/process_wound_detection/`, {}, {
        timeout: 120000, // 2 minutes timeout for wound detection + bbox crop
      });
      
      console.log('✅ Wound detection with bbox crop completed');
      return response.data;
    } catch (error) {
      console.error('Wound detection error:', error);
      throw error;
    }
  },

  // Step 2: Process depth analysis using ZoeDepth
  processDepthAnalysis: async (scanId) => {
    try {
      console.log(`Starting depth analysis for scan ${scanId}`);
      const response = await api.post(`/scans/${scanId}/process_depth_analysis/`, {}, {
        timeout: 300000, // 5 minutes timeout for ZoeDepth processing
      });
      
      console.log('✅ Depth analysis completed');
      return response.data;
    } catch (error) {
      console.error('Depth analysis error:', error);
      throw error;
    }
  },

  // Step 3: Process mesh generation with STL and preview
  processMeshGeneration: async (scanId, visualization_mode = 'balanced') => {
    try {
      console.log(`Processing mesh generation for scan ${scanId} with mode: ${visualization_mode}`);
      
      const response = await api.post(`/scans/${scanId}/process_mesh_generation/`, {
        visualization_mode
      }, {
        timeout: 180000, // 3 minutes timeout for mesh generation
      });
      
      console.log('✅ Mesh generation completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Mesh generation error:', error);
      throw error;
    }
  },

  // Process comprehensive scan (all steps in sequence)
  processComprehensiveScan: async (scanId) => {
    try {
      console.log(`Starting comprehensive AI processing for scan ${scanId}`);
      
      // Step 1: Wound Detection
      const woundResults = await aiProcessingService.processWoundDetection(scanId);
      
      // Step 2: Depth Analysis  
      const depthResults = await aiProcessingService.processDepthAnalysis(scanId);
      
      // Step 3: Mesh Generation
      const meshResults = await aiProcessingService.processMeshGeneration(scanId);
      
      // Combine all results
      const combinedResults = {
        ...woundResults,
        ...depthResults,
        ...meshResults,
        processing_pipeline: ['WoundDetector', 'ZoeDepth', 'MeshGenerator'],
        scan_id: scanId
      };
      
      console.log('✅ Comprehensive AI processing completed');
      return combinedResults;
    } catch (error) {
      console.error('Comprehensive scan processing error:', error);
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

  // Utility methods for processing results
  extractWoundDetectionUrls: (processingResults) => {
    try {
      return {
        processed_image: processingResults.processed_image,
        cropped_segmented_path: processingResults.cropped_segmented_path,
        cropped_image_path: processingResults.cropped_image_path,
        bbox_visualization_path: processingResults.bbox_visualization_path
      };
    } catch (error) {
      console.error('Error extracting wound detection URLs:', error);
      return null;
    }
  },

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

  extractMeshUrls: (processingResults) => {
    try {
      return {
        stl_file_url: processingResults.stl_generation?.stl_file_url,
        preview_image_url: processingResults.preview_generation?.preview_image_url,
        mesh_metadata: processingResults.stl_generation?.mesh_metadata
      };
    } catch (error) {
      console.error('Error extracting mesh URLs:', error);
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

  // Download files
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

  downloadSTLFile: async (stlFileUrl, filename) => {
    try {
      const response = await api.get(stlFileUrl, {
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
      console.error('Error downloading STL file:', error);
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

  // Mock processing for demo purposes (keeping for backward compatibility)
  mockProcessing: {
    comprehensiveScan: async (imageUri) => {
      // Simulate processing time for comprehensive scan
      await new Promise(resolve => setTimeout(resolve, 5000));
      return {
        status: 'Processing complete',
        processed_image: imageUri,
        cropped_segmented_path: imageUri,
        cropped_image_path: imageUri,
        depth_map_8bit: imageUri,
        depth_map_16bit: imageUri,
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
            method: 'ZoeDepth_bbox_crop'
          },
          wound_severity: 'moderate',
          processing_confidence: 0.78,
          surface_area: 245.6,
          wound_mask_extracted: true,
          analysis_method: 'ZoeDepth_bbox_crop',
          processor: 'DepthAnalyzer',
          timestamp: new Date().toISOString(),
          units: {
            depth: 'normalized_units',
            volume: 'cubic_mm',
            area: 'square_mm'
          }
        },
        stl_generation: {
          stl_file_url: imageUri,
          mesh_metadata: {
            vertex_count: 15000,
            face_count: 30000,
            volume_mm3: 1250.5,
            file_size_mb: 2.4
          }
        },
        preview_generation: {
          preview_image_url: imageUri
        },
        processing_pipeline: ['WoundDetector', 'ZoeDepth', 'MeshGenerator'],
        scan_id: 'mock_scan_id'
      };
    },

    woundDetection: async (imageUri) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        success: true,
        processed_image: imageUri,
        cropped_segmented_path: imageUri,
        cropped_image_path: imageUri,
        bbox_visualization_path: imageUri,
        bbox: { x: 150, y: 200, width: 100, height: 80 }
      };
    },

    depthAnalysis: async (imageUri) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return {
        success: true,
        depth_map_8bit: imageUri,
        depth_map_16bit: imageUri,
        depth_metadata: {
          volume_estimate: { total_volume: 2.5 },
          processing_confidence: 0.8
        }
      };
    },

    meshGeneration: async (imageUri) => {
      await new Promise(resolve => setTimeout(resolve, 4000));
      return {
        success: true,
        stl_generation: {
          stl_file_url: imageUri,
          mesh_metadata: {
            vertex_count: 15000,
            face_count: 30000,
            volume_mm3: 2.5,
            file_size_mb: 2.4
          }
        },
        preview_generation: {
          preview_image_url: imageUri
        }
      };
    }
  }
};

export default aiProcessingService; 