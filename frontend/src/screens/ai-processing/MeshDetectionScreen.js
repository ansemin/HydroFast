import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';
import { BackArrowIcon } from '../../components/ui';

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
      
      // Navigate to DownloadFilesScreen with scan result data
      const scanResultData = {
        stl_file: scanData?.stl_generation?.stl_file_url,
        preview_image: scanData?.preview_generation?.preview_image_url,
        stl_generation: {
          stl_file_size_mb: scanData?.stl_generation?.stl_file_size_mb || 0,
        },
        preview_generation: {
          preview_file_size_mb: scanData?.preview_generation?.preview_file_size_mb || 0,
        },
        volume_estimate: scanData?.depth_analysis?.volume_estimate,
        processing_metadata: {
          mesh_metadata: scanData?.stl_generation?.mesh_metadata,
          preview_metadata: scanData?.preview_generation?.preview_metadata,
        }
      };
      
      navigation.navigate('DownloadFiles', { 
        scanId, 
        scanData: scanResultData,
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
      // No STL preview available
      console.log('⚠️ [MeshDetectionScreen] No STL preview available - STL not generated yet');
      console.log('📋 [MeshDetectionScreen] Available scanData preview fields:');
      console.log('  - preview_generation?.preview_image_url:', scanData?.preview_generation?.preview_image_url);
      console.log('  - stl_preview_url:', scanData?.stl_preview_url);
      
      if (scanData) {
        console.log('🔍 [MeshDetectionScreen] scanData contains keys:', Object.keys(scanData).join(', '));
        console.log('🔍 [MeshDetectionScreen] For detailed debugging, check the Response tab in Network inspector');
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
        <Text style={styles.title}>Mesh Detection</Text>

        {/* STL Preview Image - Using same layout as other screens */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            {getMeshImageSource() ? (
              <Image 
                source={getMeshImageSource()} 
                style={styles.image}
                onError={(error) => {
                  console.log('Error loading STL preview image:', error.nativeEvent.error);
                }}
              />
            ) : (
              <View style={[styles.image, styles.placeholderContainer]}>
                <Text style={styles.placeholderText}>No mesh preview available</Text>
                <Text style={styles.placeholderSubtext}>Please generate STL file first</Text>
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

export default MeshDetectionScreen; 