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
          // Call the backend API to process the scan
          console.log('Processing scan with backend API for scanId:', scanId);
          const response = await api.post(`/scans/${scanId}/process_scan/`);
          
          console.log('Backend processing result:', response.data);
          
          // Update scanData with processed image URL if available
          if (response.data.processed_image) {
            scanData.processed_image = response.data.processed_image;
          }
        }
        
        // Wait for the specified duration
        await new Promise(resolve => setTimeout(resolve, timeoutDurationSeconds * 1000));
        
        setIsProcessing(false);
        
        if (nextScreen) {
          console.log(`Processing complete for step ${step}. Navigating to ${nextScreen}...`);
          // Pass along scan data to next screen
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
        console.error('Error during processing:', error);
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
            {step === 1 ? 'Detecting wounds...' : 'Please kindly wait while processing'}
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