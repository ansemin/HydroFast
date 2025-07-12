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
    let timeoutDurationSeconds = 5; // Default/fallback duration
    let nextScreen = null; 

    // Determine duration and next screen based on the step
    switch (step) {
      case 1: // From PhotoPreviewScreen - Process wound detection
        timeoutDurationSeconds = 5; // Reduced to 5 seconds for actual processing
        nextScreen = 'Wound Detection';
        break;
      case 2: // From WoundDetectionScreen
        timeoutDurationSeconds = 3;
        nextScreen = 'Depth Detection';
        break;
      case 3: // From DepthDetectionScreen
        timeoutDurationSeconds = 3;
        nextScreen = 'Mesh Detection';
        break;
      case 4: // From MeshDetectionScreen
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
        if (step === 1 && scanId) {
          // Call the comprehensive backend API to process the scan
          console.log('🚀 Starting comprehensive processing for scanId:', scanId);
          console.log('Pipeline: WoundDetector → ZoeDepth → DepthAnalyzer');
          
          const response = await api.post(`/scans/${scanId}/process_scan/`, {}, {
            timeout: 180000, // 3 minutes timeout for ZoeDepth processing
          });
          
          console.log('✅ Comprehensive processing completed:', response.data);
          
          // Update scanData with comprehensive processing results
          if (response.data) {
            // Store all processing results in scanData
            scanData.processed_image = response.data.processed_image;
            scanData.depth_map_8bit = response.data.depth_map_8bit;
            scanData.depth_map_16bit = response.data.depth_map_16bit;
            scanData.depth_metadata = response.data.depth_metadata;
            scanData.processing_pipeline = response.data.processing_pipeline;
            scanData.scan_id = response.data.scan_id;
            
            // Log key results
            if (response.data.depth_metadata) {
              console.log('📊 Depth Analysis Results:');
              console.log(`   • Wound Severity: ${response.data.depth_metadata.wound_severity}`);
              console.log(`   • Volume: ${response.data.depth_metadata.volume_estimate?.total_volume || 'N/A'} cubic mm`);
              console.log(`   • Confidence: ${(response.data.depth_metadata.processing_confidence * 100).toFixed(1)}%`);
              console.log(`   • Surface Area: ${response.data.depth_metadata.surface_area} mm²`);
              console.log(`   • Mask Extracted: ${response.data.depth_metadata.wound_mask_extracted ? 'Yes' : 'No'}`);
            }
          }
        }
        
        // Wait for the specified duration (reduced since actual processing is done)
        await new Promise(resolve => setTimeout(resolve, Math.min(timeoutDurationSeconds * 1000, 2000)));
        
        setIsProcessing(false);
        
        if (nextScreen) {
          console.log(`Processing complete for step ${step}. Navigating to ${nextScreen}...`);
          // Pass along enhanced scan data to next screen
          navigation.replace(nextScreen, { 
            scanId, 
            scanData, 
            patientId,
            step: step + 1 
          });
        } else {
          console.error(`Processing finished for step ${step}, but nextScreen is null.`);
        }
      } catch (error) {
        console.error('❌ Error during processing:', error);
        
        // Enhanced error handling
        if (error.code === 'ECONNABORTED') {
          console.error('⏱️ Request timed out - ZoeDepth processing took longer than expected');
        } else if (error.response) {
          console.error('🔧 Server error:', error.response.status, error.response.data);
        } else {
          console.error('🌐 Network error:', error.message);
        }
        
        setIsProcessing(false);
        // Navigate to error state or back to previous screen
        navigation.goBack();
      }
    };

    processStep();
  }, [navigation, step, scanId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Processing...</Text>
        
        {/* Loading Indicator */}
        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color="#27CFA0" />
          <Text style={styles.subText}>
            {step === 1 
              ? 'Processing: Wound Detection → ZoeDepth → Analysis...' 
              : step === 2
              ? 'Analyzing depth results...'
              : step === 3
              ? 'Generating 3D mesh...'
              : step === 4
              ? 'Preparing downloads...'
              : 'Please kindly wait while processing'
            }
          </Text>
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
    justifyContent: 'flex-start', // Align content to the top
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
  indicatorContainer: {
    flex: 1, // Take remaining vertical space
    justifyContent: 'center', // Center vertically within this container
    alignItems: 'center', // Center horizontally
    width: '100%',
    paddingBottom: 50, // Add some padding at the bottom if needed
  },
  subText: {
    marginTop: 20,
    fontSize: 14,
    color: '#000000', // Text color
    textAlign: 'center',
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default ProcessingScreen; 