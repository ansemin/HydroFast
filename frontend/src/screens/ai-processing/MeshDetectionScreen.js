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
      console.log('Starting mesh generation...');
      
      // Process mesh generation using the scan ID
      const meshResponse = await scanService.processMeshGeneration(scanId, 'balanced');
      console.log('Mesh generation completed:', meshResponse);
      
      // Combine the current scan data with the mesh results
      const combinedScanData = {
        ...scanData,
        ...meshResponse,
      };
      
      Alert.alert('Success', 'Mesh generation completed successfully');
      
      // Navigate to DownloadFilesScreen to show final results and download options
      navigation.navigate('DownloadFiles', { 
        scanId, 
        scanData: combinedScanData, 
        patientId 
      }); 
    } catch (error) {
      console.error('Error processing mesh generation:', error);
      Alert.alert('Error', `Failed to process mesh generation: ${error.message}`);
    }
  };

  // Determine STL preview image source
  const getMeshImageSource = () => {
    if (scanData?.preview_generation?.preview_image_url) {
      // If we have an STL preview URL from the mesh generation response
      console.log('Using STL preview from backend:', scanData.preview_generation.preview_image_url);
      return { uri: scanData.preview_generation.preview_image_url };
    } else if (scanData?.stl_preview_url) {
      // Legacy field name support
      console.log('Using legacy STL preview from backend:', scanData.stl_preview_url);
      return { uri: scanData.stl_preview_url };
    } else {
      // Fallback to static mesh image
      console.log('Using fallback mesh image');
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