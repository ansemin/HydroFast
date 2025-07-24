import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';

const ProcessingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { step, scanId, scanData, patientId } = route.params || {};
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let timeoutDurationSeconds = 5;
    let nextScreen = null; 

    // Determine duration and next screen based on the step
    switch (step) {
      case 1: // From PhotoPreviewScreen - Process wound detection
        timeoutDurationSeconds = 5;
        nextScreen = 'Wound Detection';
        break;
      case 2: // From WoundDetectionScreen - Process depth analysis
        timeoutDurationSeconds = 8;
        nextScreen = 'Depth Detection';
        break;
      case 3: // From DepthDetectionScreen - Process mesh generation
        timeoutDurationSeconds = 10;
        nextScreen = 'Mesh Detection';
        break;
      case 4: // From MeshDetectionScreen - Download files
        timeoutDurationSeconds = 2;
        nextScreen = 'Download Files';
        break;
      default:
        console.error(`ProcessingScreen received invalid or missing step parameter: ${step}`);
        timeoutDurationSeconds = 3;
        nextScreen = 'Patients List';
        break;
    }

    const processStep = async () => {
      try {
        let response = null;
        
        if (step === 1 && scanId) {
          // Step 1: Process wound detection only
          console.log('🎯 Processing Step 1: Wound Detection for scanId:', scanId);
          
          response = await api.post(`/scans/${scanId}/process_wound_detection/`, {}, {
            timeout: 60000, // 1 minute timeout for wound detection
          });
          
          console.log('✅ Wound detection completed:', response.data);
          
          // Update scanData with wound detection results
          if (response.data) {
            scanData.processed_image = response.data.processed_image;
            scanData.scan_id = response.data.scan_id;
          }
          
        } else if (step === 2 && scanId) {
          // Step 2: Process depth analysis using ZoeDepth
          console.log('🎯 Processing Step 2: ZoeDepth Analysis for scanId:', scanId);
          
          response = await api.post(`/scans/${scanId}/process_depth_analysis/`, {}, {
            timeout: 300000, // 5 minutes timeout for ZoeDepth processing
          });
          
          console.log('✅ ZoeDepth analysis completed:', response.data);
          
          // Update scanData with depth analysis results
          if (response.data) {
            scanData.depth_map_8bit = response.data.depth_map_8bit;
            scanData.depth_map_16bit = response.data.depth_map_16bit;
            scanData.depth_metadata = response.data.depth_metadata;
            
            // Log key ZoeDepth results
            if (response.data.depth_metadata) {
              console.log('📊 ZoeDepth Analysis Results:');
              console.log(`   • Wound Severity: ${response.data.depth_metadata.wound_severity}`);
              console.log(`   • Volume: ${response.data.depth_metadata.volume_estimate?.total_volume || 'N/A'} cubic mm`);
              console.log(`   • Confidence: ${(response.data.depth_metadata.processing_confidence * 100).toFixed(1)}%`);
              console.log(`   • Surface Area: ${response.data.depth_metadata.surface_area} mm²`);
              console.log(`   • Mask Extracted: ${response.data.depth_metadata.wound_mask_extracted ? 'Yes' : 'No'}`);
            }
          }
          
        } else if (step === 3 && scanId) {
          // Step 3: Process mesh generation
          console.log('🎯 Processing Step 3: Mesh Generation for scanId:', scanId);
          
          response = await api.post(`/scans/${scanId}/process_mesh_generation/`, {
            visualization_mode: 'enhanced' // Enhanced mode for better 3D preview
          }, {
            timeout: 300000, // 5 minutes timeout for mesh generation
          });
          
          console.log('✅ Mesh generation completed:', response.data);
          
          // Update scanData with mesh generation results
          if (response.data && response.data.stl_generation) {
            scanData.stl_file_url = response.data.stl_generation.stl_file_url;
            scanData.mesh_metadata = response.data.stl_generation.mesh_metadata;
          }
          if (response.data && response.data.preview_generation) {
            scanData.stl_preview_url = response.data.preview_generation.preview_image_url;
            scanData.preview_metadata = response.data.preview_generation.preview_metadata;
          }
        } else if (step === 4) {
          // Step 4: Final file preparation (simulation step)
          console.log('🎯 Processing Step 4: Preparing files for download...');
          
          // No API call needed - just simulate the final preparation
          // All files are already generated in previous steps
          console.log('✅ Files prepared for download');
        }
        
        // Simulate the processing delay, then navigate
        setTimeout(() => {
          setIsProcessing(false);
          navigation.replace(nextScreen, { scanId, scanData, patientId });
        }, timeoutDurationSeconds * 1000);
        
      } catch (error) {
        console.error(`Error in step ${step}:`, error);
        setIsProcessing(false);
        
        // Show error and navigate back
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    };

    processStep();
  }, [navigation, step, scanId, scanData, patientId]);

  const getStepText = () => {
    switch (step) {
      case 1:
        return 'Detecting wound boundaries...';
      case 2:
        return 'Analyzing wound depth...';
      case 3:
        return 'Generating 3D mesh...';
      case 4:
        return 'Preparing files...';
      default:
        return 'Processing...';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Processing...</Text>
        
        {/* Centered Content Container */}
        <View style={styles.centeredContent}>
          {/* Loading Animation */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
          
          {/* Processing Text */}
          <Text style={styles.processingText}>{getStepText()}</Text>
          <Text style={styles.subtitle}>Please kindly wait...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8', // Background color
  },
  container: {
    flex: 1,
    alignItems: 'center', // Center content horizontally
    justifyContent: 'flex-start', // Keep title at the top
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Adjust for Android status bar
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // Title color
    alignSelf: 'center',
    marginTop: 25, // Same as PhotoPreviewScreen title marginTop
    marginBottom: 10, // Same as PhotoPreviewScreen title marginBottom
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  loadingContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  processingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000', // Text color
    textAlign: 'center',
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  subtitle: {
    fontSize: 14,
    color: '#000000', // Text color
    textAlign: 'center',
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProcessingScreen; 