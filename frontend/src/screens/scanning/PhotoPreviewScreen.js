import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform, StatusBar, SafeAreaView } from 'react-native';
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

const PhotoPreviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, patientId, patientName, imageFile } = route.params || {};
  
  const handleRetake = () => {
    // Navigate back to camera page
    navigation.goBack();
  };
  
  const handleSubmit = async () => {
    try {
      console.log('🚀 [PhotoPreviewScreen] Starting image upload process...');
      console.log('📋 [PhotoPreviewScreen] Patient ID:', patientId);
      console.log('📋 [PhotoPreviewScreen] Patient Name:', patientName);
      console.log('📋 [PhotoPreviewScreen] Image URI:', imageUri);
      
      // Create form data
      const formData = new FormData();
      
      // Handle Web vs Native URI differently
      let filename = '';
      
      if (Platform.OS === 'web') {
        console.log('🌐 [PhotoPreviewScreen] Platform: Web - Processing web image...');
        // On web, we may be dealing with a blob, file object, or data URI
        if (imageFile) {
          // If it's already a File object from the file input
          filename = imageFile.name || `image_${Date.now()}.jpg`;
          formData.append('image', imageFile, filename);
          console.log('📎 [PhotoPreviewScreen] Using File object:', filename);
        } else if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
          // If it's a blob URL or data URI
          filename = `image_${Date.now()}.jpg`;
          console.log('🔗 [PhotoPreviewScreen] Converting blob/data URI to file:', filename);
          // For blob URLs, fetch and convert to blob
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('image', blob, filename);
        } else {
          // Already a blob or some other object
          filename = `image_${Date.now()}.jpg`;
          formData.append('image', imageUri, filename);
          console.log('📄 [PhotoPreviewScreen] Using blob object:', filename);
        }
      } else {
        console.log('📱 [PhotoPreviewScreen] Platform: Native - Processing native image...');
        // Native platforms
        filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });
        console.log('📎 [PhotoPreviewScreen] Native file:', { filename, type });
      }
      
      // Append the patient ID
      formData.append('patient', patientId);
      console.log('👤 [PhotoPreviewScreen] Added patient ID to form data:', patientId);
      
      console.log('📤 [PhotoPreviewScreen] Step 1: Uploading image to server...');
      
      // Step 1: Upload the image only (no processing yet)
      const uploadResponse = await scanService.createScan(formData);
      console.log('✅ [PhotoPreviewScreen] Upload successful!');
      console.log('📋 [PhotoPreviewScreen] Upload response:', JSON.stringify(uploadResponse, null, 2));
      console.log('🆔 [PhotoPreviewScreen] Generated scan ID:', uploadResponse.id);
      
      console.log('🧭 [PhotoPreviewScreen] Navigating to ProcessingScreen for wound segmentation...');
      
      // Navigate to ProcessingScreen for wound segmentation (Step 1 of processing)
      navigation.navigate('Processing', { 
        step: 'wound_segmentation',
        scanId: uploadResponse.id,
        scanData: uploadResponse, // Pass initial scan data
        patientId: patientId 
      });
      
      console.log('✅ [PhotoPreviewScreen] Navigation completed - handed off to ProcessingScreen');
    } catch (error) {
      console.error('❌ [PhotoPreviewScreen] Error in upload process:', error);
      console.error('❌ [PhotoPreviewScreen] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      Alert.alert('Error', `Failed to upload image: ${error.message}`);
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
        <Text style={styles.title}>Photo preview</Text>
        
        {/* Image Preview - Using fixed dimensions instead of flex */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonWrapper}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    alignItems: 'center', // Center all content horizontally
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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
    // This is a fixed space allocation in the layout
    width: '100%',
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    // This is the actual bounding box for the image
    width: '90%',
    height: 390,
    borderRadius: 13,
    overflow: 'hidden', // Ensures the image doesn't exceed the rounded corners
    backgroundColor: '#000000', // Black background
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Ensures the image fits within the box
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 20,
    paddingBottom: 25,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  retakeButton: {
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    width: '32.81%',
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: '13.13%',
  },
  submitButton: {
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    width: '32.81%',
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: '12.81%',
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

export default PhotoPreviewScreen; 