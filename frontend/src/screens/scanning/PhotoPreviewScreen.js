import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scanService } from '../../services';
import { BackArrowIcon } from '../../components/ui';

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
      console.log('🚀 [PhotoPreviewScreen] Handle Submit Triggered.');
      console.log(`   - Patient ID: ${patientId}`);
      console.log(`   - Image URI: ${imageUri}`);

      const formData = new FormData();
      
      let filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      });
      
      formData.append('patient', patientId);
      console.log('📦 [PhotoPreviewScreen] FormData created:', { patientId, filename, type });
      
      console.log('📤 [PhotoPreviewScreen] Calling scanService.createScan...');
      const uploadResponse = await scanService.createScan(formData);
      const scanId = uploadResponse.id;
      console.log('✅ [PhotoPreviewScreen] Image upload successful. Scan ID:', scanId);
      console.log('   - Response Data:', JSON.stringify(uploadResponse, null, 2));
      
      console.log('🧭 [PhotoPreviewScreen] Navigating to ProcessingScreen for initial_crop...');
      
      navigation.navigate('Processing', { 
        step: 'initial_crop',
        scanId: scanId,
        scanData: uploadResponse,
        patientId: patientId 
      });
      console.log('✅ [PhotoPreviewScreen] Navigation to ProcessingScreen complete.');
      
    } catch (error) {
      console.error('❌ [PhotoPreviewScreen] An error occurred in handleSubmit:', error);
      Alert.alert('Upload Error', `Failed to upload and process image: ${error.message}`);
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