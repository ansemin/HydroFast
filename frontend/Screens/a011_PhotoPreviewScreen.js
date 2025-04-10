import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from './../api';

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
      // Create form data
      const formData = new FormData();
      
      // Handle Web vs Native URI differently
      let filename = '';
      
      if (Platform.OS === 'web') {
        // On web, we may be dealing with a blob, file object, or data URI
        if (imageFile) {
          // If it's already a File object from the file input
          filename = imageFile.name || `image_${Date.now()}.jpg`;
          formData.append('image', imageFile, filename);
        } else if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
          // If it's a blob URL or data URI
          filename = `image_${Date.now()}.jpg`;
          // For blob URLs, fetch and convert to blob
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('image', blob, filename);
        } else {
          // Already a blob or some other object
          filename = `image_${Date.now()}.jpg`;
          formData.append('image', imageUri, filename);
        }
      } else {
        // Native platforms
        filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });
      }
      
      // Append the patient ID
      formData.append('patient', patientId);
      
      console.log('Uploading image to server for patient:', patientId);
      
      // Send the request to the Django backend
      const response = await api.post(
        '/scans/upload_image/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('Upload successful', response.data);
      Alert.alert('Success', 'Image uploaded to server successfully');
      
      // Navigate back to camera or patient detail based on user needs
      // For now, going back to the camera page
      navigation.goBack();
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', `Failed to upload image: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
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
    backgroundColor: '#000000', // Changed from light gray to black
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