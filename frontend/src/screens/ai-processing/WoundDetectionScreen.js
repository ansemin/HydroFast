import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';
import Svg, { Path } from 'react-native-svg';

// Back Arrow SVG Component
function BackArrowIcon() {
  return (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
    </Svg>
  );
}

// Fallback image if no processed image is available
const fallbackWoundImage = require('../../assets/images/0138_segmented.png');

const WoundDetectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};
  
  const handleProcess = async () => {
    try {
      // Check if depth maps already exist from wound detection (no need to reprocess)
      if (scanData?.depth_map_8bit && scanData?.depth_map_16bit) {
        console.log('Depth maps already available from wound detection, skipping reprocessing');
        
        // Navigate directly to DepthDetectionScreen with existing depth data
        navigation.navigate('DepthDetection', { 
          scanId, 
          scanData, // Already contains depth_map_8bit and depth_map_16bit
          patientId 
        });
        return;
      }
      
      console.log('Starting depth analysis...');
      
      // Process depth analysis using the scan ID (will use existing results if available)
      const depthResponse = await scanService.processDepthAnalysis(scanId);
      console.log('Depth analysis completed:', depthResponse);
      
      // Combine the current scan data with the depth results
      const combinedScanData = {
        ...scanData,
        ...depthResponse,
      };
      
      // Navigate to DepthDetectionScreen with the depth results
      navigation.navigate('DepthDetection', { 
        scanId, 
        scanData: combinedScanData, 
        patientId 
      }); 
    } catch (error) {
      console.error('Error processing depth analysis:', error);
      Alert.alert('Error', `Failed to process depth analysis: ${error.message}`);
    }
  };

  // Determine image source - use cropped segmented image from bbox workflow
  const getImageSource = () => {
    // Priority 1: Use cropped segmented image from bbox workflow (the main goal)
    if (scanData?.cropped_segmented_path) {
      return { uri: scanData.cropped_segmented_path };
    }
    
    // Priority 2: Use cropped image path (fallback from bbox workflow)
    if (scanData?.cropped_image_path) {
      return { uri: scanData.cropped_image_path };
    }
    
    // Priority 3: Use processed/segmented image if no cropped version available
    if (scanData?.processed_image) {
      return { uri: scanData.processed_image };
    } 
    
    // Priority 4: Use original image if no processed image available
    if (scanData?.image) {
      return { uri: scanData.image };
    } 
    
    // Fallback: Static image
    return fallbackWoundImage;
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
        <Text style={styles.title}>Wound Detection</Text>

        {/* Image Preview - Using fixed dimensions */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            <Image source={getImageSource()} style={styles.image} />
          </View>
        </View>
        
        {/* Action Button */}
        <View style={styles.buttonWrapper}>
          {/* Single centered button */}
          <TouchableOpacity style={styles.processButton} onPress={handleProcess}>
            <Text style={styles.buttonText}>Process</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles adapted from PhotoPreviewScreen
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

export default WoundDetectionScreen; 