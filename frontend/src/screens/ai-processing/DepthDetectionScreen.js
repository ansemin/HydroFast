import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

// Back Arrow SVG Component
function BackArrowIcon() {
  return (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
    </Svg>
  );
}

// Fallback depth image if no depth map is available
const fallbackDepthImage = require('../../assets/images/0138_depth_grayscale_zd.png');

const DepthDetectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};
  
  const handleProcess = () => {
    // Navigate to Processing screen, specifying step 3 (mesh generation)
    navigation.navigate('Processing', { 
      step: 3, 
      scanId, 
      scanData, 
      patientId 
    }); 
  };

  // Determine depth image source - use 8-bit depth map if available, otherwise fallback
  const getDepthImageSource = () => {
    if (scanData?.depth_map_8bit) {
      // If we have an 8-bit depth map URL from the backend
      console.log('Using depth map from backend:', scanData.depth_map_8bit);
      return { uri: scanData.depth_map_8bit };
    } else if (scanData?.depth_map_16bit) {
      // If we have a 16-bit depth map URL from the backend
      console.log('Using 16-bit depth map from backend:', scanData.depth_map_16bit);
      return { uri: scanData.depth_map_16bit };
    } else {
      // Fallback to static depth image
      console.log('Using fallback depth image');
      return fallbackDepthImage;
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

        {/* Depth Information */}
        {scanData?.depth_metadata && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Volume: {scanData.depth_metadata.volume_estimate?.total_volume?.toFixed(2) || 'N/A'} mm³
            </Text>
            <Text style={styles.infoText}>
              Confidence: {((scanData.depth_metadata.processing_confidence || 0) * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        {/* Depth Image Preview */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            <Image 
              source={getDepthImageSource()} 
              style={styles.image}
              onError={(error) => {
                console.log('Error loading depth image:', error.nativeEvent.error);
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 20,
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  infoContainer: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  imageOuterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  imageContainer: {
    width: 300,
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonWrapper: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default DepthDetectionScreen; 