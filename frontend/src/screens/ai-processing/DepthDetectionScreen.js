import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';
import { BackArrowIcon } from '../../components/ui';

const DepthDetectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};
  
  const handleProcess = async () => {
    try {
      console.log('🚀 [DepthDetectionScreen] Starting mesh generation process...');
      console.log('🆔 [DepthDetectionScreen] Scan ID:', scanId);
      console.log('👤 [DepthDetectionScreen] Patient ID:', patientId);
      console.log('📦 [DepthDetectionScreen] Current scan data keys:', Object.keys(scanData || {}));
      
      // Check what depth analysis outputs we have
      console.log('🔍 [DepthDetectionScreen] Checking available depth analysis outputs:');
      if (scanData?.depth_map_8bit) {
        console.log('  ✅ 8-bit depth map:', scanData.depth_map_8bit);
      }
      if (scanData?.depth_map_16bit) {
        console.log('  ✅ 16-bit depth map:', scanData.depth_map_16bit);
      }
      if (scanData?.volume_estimate) {
        console.log('  ✅ Volume estimate:', scanData.volume_estimate);
      }
      if (scanData?.depth_metadata) {
        console.log('  ✅ Depth metadata available');
      }
      
      // Validate that depth analysis was completed
      if (!scanData?.depth_map_8bit && !scanData?.depth_map_16bit) {
        console.log('⚠️ [DepthDetectionScreen] Warning: No depth analysis results found in scanData');
        console.log('📋 [DepthDetectionScreen] This might indicate an issue with the previous processing step');
      }
      
      console.log('🧭 [DepthDetectionScreen] Navigating to ProcessingScreen for mesh generation...');
      
      // Navigate to ProcessingScreen for mesh generation (Step 4 of processing)
      navigation.navigate('Processing', { 
        step: 'mesh_generation',
        scanId: scanId,
        scanData: scanData, // Pass current scan data
        patientId: patientId 
      });
      
      console.log('✅ [DepthDetectionScreen] Navigation completed - handed off to ProcessingScreen');
    } catch (error) {
      console.error('❌ [DepthDetectionScreen] Error navigating to processing:', error);
      console.error('❌ [DepthDetectionScreen] Error details:', {
        message: error.message,
        scanId: scanId,
        patientId: patientId
      });
      Alert.alert('Error', `Failed to start mesh generation: ${error.message}`);
    }
  };

  // Determine depth image source - use 8-bit depth map if available, otherwise fallback
  const getDepthImageSource = () => {
    console.log('🔍 [DepthDetectionScreen] Determining depth image source...');
    console.log('📦 [DepthDetectionScreen] Available scanData keys:', Object.keys(scanData || {}));
    
    if (scanData?.depth_map_8bit) {
      // If we have an 8-bit depth map URL from the backend
      console.log('✅ [DepthDetectionScreen] Using 8-bit depth map from backend:', scanData.depth_map_8bit);
      return { uri: scanData.depth_map_8bit };
    } else if (scanData?.depth_map_16bit) {
      // If we have a 16-bit depth map URL from the backend
      console.log('✅ [DepthDetectionScreen] Using 16-bit depth map from backend:', scanData.depth_map_16bit);
      return { uri: scanData.depth_map_16bit };
    } else {
      // No depth maps available
      console.log('⚠️ [DepthDetectionScreen] No depth maps available - depth processing not done yet');
      console.log('📋 [DepthDetectionScreen] Available depth fields:');
      console.log('  - depth_map_8bit:', scanData?.depth_map_8bit);
      console.log('  - depth_map_16bit:', scanData?.depth_map_16bit);
      console.log('  - volume_estimate:', scanData?.volume_estimate);
      console.log('  - depth_metadata:', scanData?.depth_metadata ? 'available' : 'not available');
      
      if (scanData) {
        console.log('🔍 [DepthDetectionScreen] scanData contains keys:', Object.keys(scanData).join(', '));
        console.log('🔍 [DepthDetectionScreen] For detailed debugging, check the Response tab in Network inspector');
      }
      
      return null;
    }
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
        <Text style={styles.title}>Depth Detection</Text>

        {/* Depth Image Preview - Using same layout as WoundDetectionScreen */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            {getDepthImageSource() ? (
              <Image 
                source={getDepthImageSource()} 
                style={styles.image}
                onError={(error) => {
                  console.log('Error loading depth image:', error.nativeEvent.error);
                }}
              />
            ) : (
              <View style={[styles.image, styles.placeholderContainer]}>
                <Text style={styles.placeholderText}>No depth map available</Text>
                <Text style={styles.placeholderSubtext}>Please generate depth map first</Text>
              </View>
            )}
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

// Styles exactly matching WoundDetectionScreen for consistency
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8', // Background color matching WoundDetectionScreen
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
    height: 420, // Keep same height as other screens for consistency
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
    backgroundColor: '#27CFA0', // Specified green color matching other screens
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
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default DepthDetectionScreen; 