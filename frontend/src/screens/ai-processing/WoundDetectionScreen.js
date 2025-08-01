import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';
import { BackArrowIcon } from '../../components/ui';

const WoundDetectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};
  
  const handleProcess = async () => {
    try {
      console.log('🚀 [WoundDetectionScreen] Process Button Pressed.');
      console.log('   - Current Scan ID:', scanId);
      console.log(`   - Navigating to ProcessingScreen with step: 'depth_analysis'`);

      navigation.navigate('Processing', { 
        step: 'depth_analysis',
        scanId: scanId,
        scanData: scanData,
        patientId: patientId 
      });
      console.log('✅ [WoundDetectionScreen] Navigation to ProcessingScreen complete.');
    } catch (error) {
      console.error('❌ [WoundDetectionScreen] An error occurred in handleProcess:', error);
      Alert.alert('Navigation Error', `Failed to start depth analysis: ${error.message}`);
    }
  };

  // This screen should display the cropped *segmented* image.
  const getImageSource = () => {
    if (scanData?.cropped_segmented_path) {
      console.log('🎯 [WoundDetectionScreen] Found cropped_segmented_path:', scanData.cropped_segmented_path);
      return { uri: scanData.cropped_segmented_path };
    }
    
    console.log('⚠️ [WoundDetectionScreen] cropped_segmented_path not found in scanData.');
    console.log('   - Full scanData for debugging:', JSON.stringify(scanData, null, 2));
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        <Text style={styles.title}>Wound Detection</Text>

        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            {getImageSource() ? (
              <Image source={getImageSource()} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholderContainer]}>
                <Text style={styles.placeholderText}>No processed image available</Text>
                <Text style={styles.placeholderSubtext}>Please run AI processing first</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.buttonWrapper}>
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

export default WoundDetectionScreen; 