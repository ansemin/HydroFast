import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';

const ProcessingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { step, scanId, scanData, patientId } = route.params || {};

  useEffect(() => {
    console.log(`🚀 [ProcessingScreen] Starting step: ${step}`);
    console.log(`🆔 [ProcessingScreen] Scan ID: ${scanId}`);
    console.log(`👤 [ProcessingScreen] Patient ID: ${patientId}`);
    console.log(`📦 [ProcessingScreen] Current scan data keys: ${Object.keys(scanData || {})}`);

    const processStep = async () => {
      try {
        let response = null;
        let nextScreen = null;
        let combinedScanData = { ...scanData };
        
        if (step === 'wound_segmentation' && scanId) {
          // Step 1: YOLO wound segmentation
          console.log('🤖 [ProcessingScreen] Processing Step 1: YOLO wound segmentation for scanId:', scanId);
          
          response = await scanService.processWoundSegmentation(scanId);
          
          console.log('✅ [ProcessingScreen] Wound segmentation completed:', response);
          
          // Combine scan data with segmentation results
          combinedScanData = {
            ...scanData,
            ...response
          };
          
          nextScreen = 'CroppedOriginal'; // Show original image, ready for bbox detection
          
        } else if (step === 'bbox_detection' && scanId) {
          // Step 2: Bbox detection and cropping
          console.log('📦 [ProcessingScreen] Processing Step 2: Bbox detection for scanId:', scanId);
          
          response = await scanService.processBboxDetection(scanId);
          
          console.log('✅ [ProcessingScreen] Bbox detection completed:', response);
          
          // Combine scan data with bbox results
          combinedScanData = {
            ...scanData,
            ...response
          };
          
          nextScreen = 'WoundDetection'; // Show cropped segmented image, ready for depth analysis
          
        } else if (step === 'depth_analysis' && scanId) {
          // Step 3: ZoeDepth processing
          console.log('🔍 [ProcessingScreen] Processing Step 3: ZoeDepth analysis for scanId:', scanId);
          
          response = await scanService.processDepthAnalysis(scanId);
          
          console.log('✅ [ProcessingScreen] ZoeDepth analysis completed:', response);
          
          // Combine scan data with depth results
          combinedScanData = {
            ...scanData,
            ...response
          };
          
          nextScreen = 'DepthDetection'; // Show depth maps, ready for mesh generation
          
        } else if (step === 'mesh_generation' && scanId) {
          // Step 4: Mesh and preview generation
          console.log('🏗️ [ProcessingScreen] Processing Step 4: Mesh generation for scanId:', scanId);
          
          response = await scanService.processMeshGeneration(scanId, 'balanced');
          
          console.log('✅ [ProcessingScreen] Mesh generation completed:', response);
          
          // Combine scan data with mesh results
          combinedScanData = {
            ...scanData,
            ...response
          };
          
          nextScreen = 'MeshDetection'; // Show STL preview, ready for download
          
        } else {
          console.error(`❌ [ProcessingScreen] Invalid or missing step parameter: ${step}`);
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
          return;
        }
        
        console.log(`🔗 [ProcessingScreen] Combined scan data keys: ${Object.keys(combinedScanData)}`);
        console.log(`🧭 [ProcessingScreen] Navigating to: ${nextScreen}`);
        
        // Navigate to next screen with updated scan data
        setTimeout(() => {
          navigation.replace(nextScreen, { 
            scanId, 
            scanData: combinedScanData, 
            patientId 
          });
        }, 1500); // Brief delay to show completion
        
      } catch (error) {
        console.error(`❌ [ProcessingScreen] Error in step ${step}:`, error);
        console.error(`❌ [ProcessingScreen] Error details:`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        // Show error and navigate back after delay
        setTimeout(() => {
          navigation.goBack();
        }, 3000);
      }
    };

    processStep();
  }, [navigation, step, scanId, scanData, patientId]);

  const getStepText = () => {
    switch (step) {
      case 'wound_segmentation':
        return 'Analyzing wound boundaries with AI...';
      case 'bbox_detection':
        return 'Detecting and cropping wound area...';
      case 'depth_analysis':
        return 'Generating depth maps with ZoeDepth...';
      case 'mesh_generation':
        return 'Creating 3D mesh and preview...';
      default:
        return 'Processing...';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'wound_segmentation':
        return 'Using YOLO to identify wound regions';
      case 'bbox_detection':
        return 'Cropping images for focused analysis';
      case 'depth_analysis':
        return 'Estimating wound depth and volume';
      case 'mesh_generation':
        return 'Building 3D model for visualization';
      default:
        return 'Please kindly wait...';
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
            <ActivityIndicator size="large" color="#27CFA0" />
          </View>
          
          {/* Processing Text */}
          <Text style={styles.processingText}>{getStepText()}</Text>
          <Text style={styles.subtitle}>{getStepDescription()}</Text>
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
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    marginTop: 20,
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    color: '#000000', // Text color
    textAlign: 'center',
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  subtitle: {
    fontSize: 12,
    color: '#888888', // Subtitle color
    textAlign: 'center',
    marginTop: 5,
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default ProcessingScreen; 