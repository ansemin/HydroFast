import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';
import { BackArrowIcon } from '../../components/ui';

// Fallback image if no cropped original image is available
const fallbackOriginalImage = require('../../assets/images/0138_segmented.png');

const CroppedOriginalScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};
  
  const handleProcess = async () => {
    try {
      console.log('🚀 [CroppedOriginalScreen] Process Button Pressed.');
      console.log('   - Current Scan ID:', scanId);
      console.log(`   - Navigating to ProcessingScreen with step: 'segment_cropped'`);
      
      navigation.navigate('Processing', { 
        step: 'segment_cropped',
        scanId: scanId,
        scanData: scanData,
        patientId: patientId 
      });
      console.log('✅ [CroppedOriginalScreen] Navigation to ProcessingScreen complete.');
    } catch (error) {
      console.error('❌ [CroppedOriginalScreen] An error occurred in handleProcess:', error);
      Alert.alert('Navigation Error', `Failed to start next processing step: ${error.message}`);
    }
  };

  // This screen should display the cropped *original* image from the initial processing step.
  const getImageSource = () => {
    console.log('🔍 [CroppedOriginalScreen] Component Rendered. Determining image source...');
    console.log(`   - Available ScanData Keys: ${Object.keys(scanData || {}).join(', ')}`);
    
    if (scanData?.cropped_image_path) {
      console.log('🎯 [CroppedOriginalScreen] Found cropped_image_path:', scanData.cropped_image_path);
      return { uri: scanData.cropped_image_path };
    }
    
    console.log('⚠️ [CroppedOriginalScreen] cropped_image_path not found in scanData. Using fallback image.');
    console.log('   - Full scanData for debugging:', JSON.stringify(scanData, null, 2));
    return fallbackOriginalImage;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Cropped Original</Text>

        {/* Image Preview */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            <Image source={getImageSource()} style={styles.image} />
          </View>
        </View>
        
        {/* Action Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.processButton} onPress={handleProcess}>
            <Text style={styles.buttonText}>Process</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles identical to WoundDetectionScreen for consistency
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8', // Background color
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 18,
    padding: 10,
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center all content horizontally
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // Black color
    alignSelf: 'center',
    marginTop: 25, 
    marginBottom: 10, 
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },

  imageOuterContainer: {
    width: '100%',
    height: 420, // Keep same height as photo preview for consistency
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '90%',
    height: 390, // Keep same height
    borderRadius: 13,
    overflow: 'hidden', 
    backgroundColor: '#000000', // Black background
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', 
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 20, 
    paddingBottom: 25,
    alignItems: 'center', // Center the button horizontally
  },
  processButton: {
    backgroundColor: '#27CFA0', // Specified green color
    borderRadius: 13,
    width: '40%', // Adjust width as needed, centered
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF', // White text
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default CroppedOriginalScreen; 