import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button, Image, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';

import * as FileSystem from 'expo-file-system';

import { useNavigation, useRoute } from '@react-navigation/native';

import api from './../api';

const { width } = Dimensions.get('window');

const CameraPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params || {};
  const preSelectedPatientId = routeParams.patientId;

  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const [patients, setPatients] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const cameraRef = useRef(null);
  
  // Track if we came from patient detail
  const [cameFromPatientDetail, setCameFromPatientDetail] = useState(false);

  useEffect(() => {
    // Fetch patients from backend API
    api.get('/patients/')
      .then((response) => {
        console.log(response.data)
        const fetchedPatients = response.data;
        setPatients(fetchedPatients);
        
        // If we have a preSelectedPatientId from route params, find and select that patient
        if (preSelectedPatientId) {
          const patientToSelect = fetchedPatients.find(p => p.id === preSelectedPatientId);
          if (patientToSelect) {
            setSelectedPatient(patientToSelect);
            setCameFromPatientDetail(true);
          } else if (fetchedPatients.length > 0) {
            setSelectedPatient(fetchedPatients[0]);
          } else {
            setSelectedPatient(null);
          }
        } else if (fetchedPatients.length > 0) {
          // No preselected patient, default to first in list
          setSelectedPatient(fetchedPatients[0]);
        } else {
          setSelectedPatient(null);
        }
      })
      .catch((error) => {
        console.error('Error fetching patients:', error);
        // Add fallback data for testing when API is unavailable
        const fallbackPatients = [
          { id: 1, first_name: 'Xavier', last_name: 'Lim', nric: 'SX1364X4F' },
          { id: 2, first_name: 'Robert', last_name: 'Tan', nric: 'SX2468X4F' },
          { id: 3, first_name: 'Hubert', last_name: 'Ong', nric: 'SX3692X4F' },
        ];
        setPatients(fallbackPatients);
        
        if (preSelectedPatientId) {
          const patientToSelect = fallbackPatients.find(p => p.id === preSelectedPatientId);
          if (patientToSelect) {
            setSelectedPatient(patientToSelect);
            setCameFromPatientDetail(true);
          } else {
            setSelectedPatient(fallbackPatients[0]);
          }
        } else {
          setSelectedPatient(fallbackPatients[0]);
        }
      });
  }, [preSelectedPatientId]);

  // const [selectedPatient, setSelectedPatient] = useState({
  //   name: 'Xavier Lim',
  //   id: 'SX1364X4F',
  // });

  // const patients = [
  //   { name: 'Xavier Lim', id: 'SX1364X4F' },
  //   { name: 'Robert Tan', id: 'SX2468X4F' },
  //   { name: 'Hubert Ong', id: 'SX3692X4F' },
  // ];

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const saveImage = async (tempUri) => {
    try {
      // Check if running on web
      if (Platform.OS === 'web') {
        console.log('Running on web platform, skipping local file save');
        // On web, just return the temporary URI since we can't save to the file system
        return tempUri;
      }
      
      // Native platform code (iOS/Android)
      // Generate a unique file name with a timestamp
      const fileName = `scan_${Date.now()}.jpg`;
      const newPath = `${FileSystem.documentDirectory}images/${fileName}`;
  
      // Ensure the "images" directory exists
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images/`, {
        intermediates: true,
      });
  
      // Move the image to the new path
      await FileSystem.moveAsync({
        from: tempUri,
        to: newPath,
      });
  
      console.log('Image saved to:', newPath);
      return newPath; // Return the saved path for further use
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image.');
      return null;
    }
  };

  const uploadImageToServer = async (localUri, patientId) => {
    try {
      // Create form data
      const formData = new FormData();
      
      // Handle Web vs Native URI differently
      let uriToUse = localUri;
      let filename = '';
      
      if (Platform.OS === 'web') {
        // On web, we may be dealing with a blob, file object, or data URI
        if (localUri instanceof File) {
          // If it's already a File object from the file input
          filename = localUri.name || `image_${Date.now()}.jpg`;
          formData.append('image', localUri, filename);
        } else if (localUri.startsWith('blob:') || localUri.startsWith('data:')) {
          // If it's a blob URL or data URI
          filename = `image_${Date.now()}.jpg`;
          // For blob URLs, fetch and convert to blob
          const response = await fetch(localUri);
          const blob = await response.blob();
          formData.append('image', blob, filename);
        } else {
          // Already a blob or some other object
          filename = `image_${Date.now()}.jpg`;
          formData.append('image', localUri, filename);
        }
      } else {
        // Native platforms
        filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: localUri,
          name: filename,
          type,
        });
      }
      
      // Append the patient ID - ensure we're using the ID property, not the entire patient object
      formData.append('patient', patientId);
      
      console.log('Uploading image to server for patient:', patientId);
      
      // Send the request to your Django backend
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
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', `Failed to upload image: ${error.message}`);
      throw error;
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        // Check if a patient is selected
        if (!selectedPatient) {
          Alert.alert('Error', 'Please select a patient before taking a photo.');
          return;
        }

        // Capture the photo
        const photo = await cameraRef.current.takePictureAsync();
        console.log('Photo captured:', photo.uri);
  
        try {
          // Save the photo locally (this will be skipped on web platform)
          const savedUri = await saveImage(photo.uri);
          
          // Use either the saved URI or the original URI for upload
          const uriToUpload = savedUri || photo.uri;
          
          // Upload the image to the server - make sure we're passing the ID
          await uploadImageToServer(uriToUpload, selectedPatient.id);
        } catch (error) {
          console.error('Error processing photo:', error);
          
          // Enhanced error reporting with detailed information
          console.error('Detailed error info:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            platform: Platform.OS
          });
          
          // If we're on web and the error is related to FileSystem, try direct upload
          if (Platform.OS === 'web' && error.message && error.message.includes('expo-file-system')) {
            try {
              console.log('Attempting direct upload on web platform');
              await uploadImageToServer(photo.uri, selectedPatient.id);
            } catch (uploadError) {
              console.error('Direct upload failed:', uploadError);
              console.error('Detailed upload error:', {
                message: uploadError.message,
                stack: uploadError.stack,
                name: uploadError.name
              });
              Alert.alert('Error', 'Failed to upload image. Please try again.');
            }
          } else {
            Alert.alert('Error', `Failed to process photo: ${error.message}`);
          }
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        console.error('Detailed camera error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          platform: Platform.OS
        });
        Alert.alert('Error', `Failed to capture photo: ${error.message}`);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleDropdown = () => {
    setDropdownVisible((prevVisible) => !prevVisible);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setDropdownVisible(false); // Hide dropdown after selection
  };

  // Add a function to handle picking images from the gallery
  const pickImage = async () => {
    console.log('pickImage function called');
    
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient before uploading a photo.');
      return;
    }
    
    // Check if we're on web platform
    if (Platform.OS === 'web') {
      console.log('Running on web platform, using web-specific image picker');
      
      // For web, we need to handle file input differently
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      
      // Set up the onchange handler before clicking
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
          console.log('Selected file from web input:', file.name);
          
          // Upload the selected image to the server - pass the actual File object
          await uploadImageToServer(file, selectedPatient.id);
        } catch (error) {
          console.error('Error uploading selected image:', error);
          Alert.alert('Error', `Failed to upload selected image: ${error.message}`);
        }
      };
      
      // Trigger the file input click - this opens the file selector
      fileInput.click();
    } else {
      // Native platform code (iOS/Android)
      console.log('Requesting media library permissions...');
      
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Permission status:', status);
        
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
          return;
        }

        console.log('Launching image picker...');
        // Launch the image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        console.log('Image picker result:', result);

        if (!result.canceled && result.assets && result.assets.length > 0) {
          try {
            const selectedImage = result.assets[0];
            console.log('Selected image from gallery:', selectedImage.uri);
            
            // Upload the selected image to the server
            await uploadImageToServer(selectedImage.uri, selectedPatient.id);
          } catch (error) {
            console.error('Error uploading selected image:', error);
            Alert.alert('Error', `Failed to upload selected image: ${error.message}`);
          }
        }
      } catch (error) {
        console.error('Error in pickImage function:', error);
        Alert.alert('Error', `Failed to open image picker: ${error.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
        {/* Patient Info */}
        <View style={styles.patientInfo}>
            {/* Back Button - only show when coming from patient detail */}
            {cameFromPatientDetail && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                  <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="white"/>
                </Svg>
              </TouchableOpacity>
            )}
            
            {/* Display Selected Patient Information */}
            <View style={styles.patientInfoTextContainer}>
                {selectedPatient ? (
                  <>
                    <Text style={styles.patientName}>{selectedPatient.first_name} {selectedPatient.last_name}</Text>
                    <Text style={styles.patientID}>{selectedPatient.nric}</Text>
                  </>
                ) : (
                  <Text style={styles.patientName}>No patient selected</Text>
                )}
            </View>
            
            {/* Dropdown Panel - only show if not coming from patient detail */}
            {dropdownVisible && !cameFromPatientDetail && (
            <View style={styles.dropdownPanel}>
                {patients.map((patient, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => selectPatient(patient)}
                >
                    <Text style={styles.dropdownText}>{patient.first_name} {patient.last_name} - {patient.nric}</Text>
                </TouchableOpacity>
                ))}
            </View>
            )}

        </View>

      {/* Camera View */}
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>

      </CameraView>
      <View style={styles.overlayContainer}>
          {/* Footer Buttons */}
          <View style={styles.footerContainer}>
            {/* Removing ImgGPT ScrollView
            <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16} // Update scroll every 16 ms for smoother experience
            contentContainerStyle={styles.footerContentContainer}
            >
            </ScrollView>
            */}

            {/* Capture Button */}
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.leftButtonsContainer}>
                {/* Home button commented out - can be used later 
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Image source={require('./a008_assets/homeIcon.png')} style={styles.icon} />
                </TouchableOpacity>
                */}
                <TouchableOpacity onPress={pickImage}>
                    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <Path
                        d="M33.3333 33.3333H6.66667C5.78261 33.3333 4.93476 32.9821 4.30964 32.357C3.68452 31.7319 3.33333 30.884 3.33333 30V10C3.33333 9.11594 3.68452 8.2681 4.30964 7.64298C4.93476 7.01786 5.78261 6.66667 6.66667 6.66667H33.3333C34.2174 6.66667 35.0652 7.01786 35.6904 7.64298C36.3155 8.2681 36.6667 9.11594 36.6667 10V30C36.6667 30.884 36.3155 31.7319 35.6904 32.357C35.0652 32.9821 34.2174 33.3333 33.3333 33.3333Z" 
                        stroke="white" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <Path 
                        d="M13.3333 16.6667C15.1743 16.6667 16.6667 15.1743 16.6667 13.3333C16.6667 11.4924 15.1743 10 13.3333 10C11.4924 10 10 11.4924 10 13.3333C10 15.1743 11.4924 16.6667 13.3333 16.6667Z" 
                        stroke="white" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <Path 
                        d="M3.33333 26.6667L13.3333 16.6667L33.3333 36.6667" 
                        stroke="white" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </Svg>
                </TouchableOpacity>
            </View>

            <View style={styles.rightButtonsContainer}>
                {/* Flip Camera Button */}
                <TouchableOpacity onPress={toggleCameraFacing}>
                    <Image source={require('./a008_assets/flipCameraIcon.png')} style={styles.icon} />
                </TouchableOpacity>
                {/* Settings icon commented out - can be used later
                <TouchableOpacity onPress={() => navigation.navigate('Printer Settings')}>
                    <Image source={require('./a008_assets/settingsIcon.png')} style={styles.icon} />
                </TouchableOpacity>
                */}
            </View>
          </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    margin: 10,
    marginBottom: 130,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 120,
    backgroundColor: '#000000',
    zIndex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  patientInfo: {
    marginBottom: 15,
    paddingTop: 45,
  },
  patientInfoTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  patientName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '400',
  },
  patientID: {
    color: 'white',
    fontSize: 20,
    fontWeight: '400',
  },
  dropdownPanel: {
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  dropdownItem: {
    paddingVertical: 8,
  },
  dropdownText: {
    color: 'white',
    fontSize: 16,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    height: 100,
  },
  leftButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    left: 10,
    bottom: 14,
    width: '40%',
  },
  rightButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    right: 8,
    bottom: 14,
    width: '40%',
    marginLeft: 5,
  },
  icon: {
    width: 40,
    height: 40,
    marginHorizontal: 10,
  },
  captureButton: {
    position: 'absolute',
    bottom: 10,
    left: '45%',
    width: 49,
    height: 49,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 41.6,
    height: 41.6,
    backgroundColor: '#D9D9D9',
    borderRadius: 50,
  },
  flipButton: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    marginLeft: -50,
  },
  flipText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 5,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraPage;
