import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Assuming the image is located at src/assets/images/0138_segmented.png
const woundImage = require('../../assets/images/0138_segmented.png');

const WoundDetectionScreen = () => {
  const navigation = useNavigation();
  
  const handleProcess = () => {
    // Navigate to Processing screen, specifying step 2
    navigation.navigate('Processing', { step: 2 }); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Wound Detection</Text>
        
        {/* Image Preview - Using fixed dimensions */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            {/* Use the required local image */}
            <Image source={woundImage} style={styles.image} />
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