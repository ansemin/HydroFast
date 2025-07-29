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

// Fallback mesh image if no STL preview is available
const fallbackMeshImage = require('../../assets/images/0138_mesh_consistent_z05.png');

const MeshDetectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};

  const handleProcess = async () => {
    try {
      console.log('🚀 [MeshDetectionScreen] Navigating to download screen...');
      console.log('🆔 [MeshDetectionScreen] Scan ID:', scanId);
      console.log('👤 [MeshDetectionScreen] Patient ID:', patientId);
      console.log('📦 [MeshDetectionScreen] Current scan data keys:', Object.keys(scanData || {}));
      
      // Check what mesh generation outputs we have
      console.log('🔍 [MeshDetectionScreen] Checking available mesh generation outputs:');
      if (scanData?.stl_generation?.stl_file_url) {
        console.log('  ✅ STL file URL:', scanData.stl_generation.stl_file_url);
      }
      if (scanData?.preview_generation?.preview_image_url) {
        console.log('  ✅ STL preview image URL:', scanData.preview_generation.preview_image_url);
      }
      if (scanData?.mesh_metadata) {
        console.log('  ✅ Mesh metadata available');
      }
      if (scanData?.depth_analysis) {
        console.log('  ✅ Depth analysis data available');
      }
      
      // Validate that mesh generation was completed
      if (!scanData?.stl_generation?.stl_file_url && !scanData?.preview_generation?.preview_image_url) {
        console.log('⚠️ [MeshDetectionScreen] Warning: No mesh generation results found in scanData');
        console.log('📋 [MeshDetectionScreen] This might indicate an issue with the previous processing step');
      }
      
      console.log('🧭 [MeshDetectionScreen] Navigating to DownloadFilesScreen...');
      console.log('📦 [MeshDetectionScreen] Passing complete scan data with all processing results');
      console.log('🎉 [MeshDetectionScreen] Complete AI processing pipeline finished!');
      
      // Navigate directly to DownloadFilesScreen (no more processing needed)
      navigation.navigate('DownloadFiles', { 
        scanId, 
        scanData, // Should now contain mesh generation results
        patientId 
      });
      
      console.log('✅ [MeshDetectionScreen] Navigation completed - processing pipeline complete!');
    } catch (error) {
      console.error('❌ [MeshDetectionScreen] Error navigating to download:', error);
      console.error('❌ [MeshDetectionScreen] Error details:', {
        message: error.message,
        scanId: scanId,
        patientId: patientId
      });
      Alert.alert('Error', `Failed to navigate: ${error.message}`);
    }
  };

  // Determine STL preview image source
  const getMeshImageSource = () => {
    console.log('🔍 [MeshDetectionScreen] Determining STL preview image source...');
    console.log('📦 [MeshDetectionScreen] Available scanData keys:', Object.keys(scanData || {}));
    
    if (scanData?.preview_generation?.preview_image_url) {
      // If we have an STL preview URL from the mesh generation response
      console.log('✅ [MeshDetectionScreen] Using STL preview from backend:', scanData.preview_generation.preview_image_url);
      return { uri: scanData.preview_generation.preview_image_url };
    } else if (scanData?.stl_preview_url) {
      // Legacy field name support
      console.log('✅ [MeshDetectionScreen] Using legacy STL preview from backend:', scanData.stl_preview_url);
      return { uri: scanData.stl_preview_url };
    } else {
      // Fallback to static mesh image
      console.log('⚠️ [MeshDetectionScreen] Using fallback mesh image - STL preview not generated');
      console.log('📋 [MeshDetectionScreen] Available scanData preview fields:');
      console.log('  - preview_generation?.preview_image_url:', scanData?.preview_generation?.preview_image_url);
      console.log('  - stl_preview_url:', scanData?.stl_preview_url);
      
      if (scanData) {
        console.log('🔍 [MeshDetectionScreen] Full scanData structure:');
        console.log(JSON.stringify(scanData, null, 2));
      }
      
      return fallbackMeshImage;
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
        <Text style={styles.title}>Mesh Detection</Text>

        {/* STL Preview Image - Using same layout as other screens */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            <Image 
              source={getMeshImageSource()} 
              style={styles.image}
              onError={(error) => {
                console.log('Error loading STL preview image:', error.nativeEvent.error);
              }}
            />
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

// Styles matching other screens for consistency
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8', // Background color matching other screens
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
    resizeMode: 'contain', // Use contain for 3D mesh previews to show the full model
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
});

export default MeshDetectionScreen; 