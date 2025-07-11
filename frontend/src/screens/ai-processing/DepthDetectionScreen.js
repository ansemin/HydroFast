import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

// Back Arrow SVG Component
function BackArrowIcon() {
  return (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
    </Svg>
  );
}

// Image for depth detection
const depthImage = require('../../assets/images/0138_depth_grayscale_zd.png');

const DepthDetectionScreen = () => {
  const navigation = useNavigation();
  
  const handleProcess = () => {
    // Navigate to Processing screen, specifying step 3
    navigation.navigate('Processing', { step: 3 }); 
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
        
        {/* Image Preview - Using fixed dimensions */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            {/* Use the required local depth image */}
            <Image source={depthImage} style={styles.image} />
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

// Styles adapted from WoundDetectionScreen/PhotoPreviewScreen
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8',
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
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
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
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '90%',
    height: 390,
    borderRadius: 13,
    overflow: 'hidden', 
    backgroundColor: '#000000',
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
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    width: '40%',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default DepthDetectionScreen; 