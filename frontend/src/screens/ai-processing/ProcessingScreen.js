import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';

const ProcessingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { step, scanId, scanData, patientId } = route.params || {};
  const [currentStepText, setCurrentStepText] = useState('');

  useEffect(() => {
    const processFlow = async () => {
      console.log('🚀 [ProcessingScreen] Component Mounted.');
      console.log(`   - Step: ${step}`);
      console.log(`   - Scan ID: ${scanId}`);
      console.log(`   - Initial ScanData Keys: ${Object.keys(scanData || {}).join(', ')}`);

      let response = null;
      let nextScreen = '';
      let combinedScanData = { ...scanData };

      try {
        setCurrentStepText(getStepText(step));
        console.log(`🚀 [ProcessingScreen] Starting API call for step: ${step}`);

        switch (step) {
          case 'initial_crop':
            response = await scanService.processInitialCrop(scanId);
            console.log('✅ [ProcessingScreen] API call for initial_crop successful.');
            nextScreen = 'CroppedOriginal';
            break;
          
          case 'segment_cropped':
            response = await scanService.processCroppedSegmentation(scanId);
            console.log('✅ [ProcessingScreen] API call for segment_cropped successful.');
            nextScreen = 'WoundDetection';
            break;

          case 'depth_analysis':
            response = await scanService.processDepthAnalysis(scanId);
            console.log('✅ [ProcessingScreen] API call for depth_analysis successful.');
            nextScreen = 'DepthDetection';
            break;

          case 'mesh_generation':
            response = await scanService.processMeshGeneration(scanId, 'balanced');
            console.log('✅ [ProcessingScreen] API call for mesh_generation successful.');
            nextScreen = 'MeshDetection';
            break;

          default:
            throw new Error(`Invalid processing step: ${step}`);
        }

        if (response) {
          console.log(`   - Response Data from ${step}:`, JSON.stringify(response, null, 2));
          combinedScanData = { ...combinedScanData, ...response };
        }

        console.log(`🧭 [ProcessingScreen] Navigation prepared.`);
        console.log(`   - Target Screen: ${nextScreen}`);
        console.log(`   - Final ScanData Keys: ${Object.keys(combinedScanData).join(', ')}`);
        
        navigation.replace(nextScreen, { 
          scanId, 
          scanData: combinedScanData, 
          patientId 
        });
        console.log('✅ [ProcessingScreen] Navigation complete.');

      } catch (error) {
        console.error(`❌ [ProcessingScreen] An error occurred during step '${step}':`, error);
        if (error.response) {
          console.error('   - Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        setTimeout(() => navigation.goBack(), 3000);
      }
    };

    processFlow();
  }, [navigation, step, scanId, scanData, patientId]);

  const getStepText = (currentStep) => {
    switch (currentStep) {
      case 'initial_crop':
        return 'Detecting wound and cropping image...';
      case 'segment_cropped':
        return 'Segmenting cropped wound...';
      case 'depth_analysis':
        return 'Generating depth map...';
      case 'mesh_generation':
        return 'Creating 3D mesh...';
      default:
        return 'Processing...';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Processing...</Text>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#27CFA0" />
          <Text style={styles.processingText}>{currentStepText}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    alignSelf: 'center',
    marginTop: 25,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Urbanist' : 'Urbanist',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 20,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Urbanist' : 'Urbanist',
  },
});

export default ProcessingScreen; 