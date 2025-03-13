import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button, Image, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';

import * as FileSystem from 'expo-file-system';

import { useNavigation } from '@react-navigation/native';

import api from './../api';

const { width } = Dimensions.get('window');

const CameraPage = () => {
  const navigation = useNavigation();

  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const [patients, setPatients] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Fetch patients from backend API
    api.get('/patients/')
      .then((response) => {
        console.log(response.data)
        const fetchedPatients = response.data;
        setPatients(fetchedPatients);
        
        // Set the first patient as selected, or null if the list is empty
        if (fetchedPatients.length > 0) {
          setSelectedPatient(fetchedPatients[0]);
        } else {
          setSelectedPatient(null);
        }
      })
      .catch((error) => {
        console.error('Error fetching patients:', error);
        // Add fallback data for testing when API is unavailable
        const fallbackPatients = [
          { first_name: 'Xavier', last_name: 'Lim', nric: 'SX1364X4F' },
          { first_name: 'Robert', last_name: 'Tan', nric: 'SX2468X4F' },
          { first_name: 'Hubert', last_name: 'Ong', nric: 'SX3692X4F' },
        ];
        setPatients(fallbackPatients);
        setSelectedPatient(fallbackPatients[0]);
      });
  }, []);


  // const [selectedPatient, setSelectedPatient] = useState({
  //   name: 'Xavier Lim',
  //   id: 'SX1364X4F',
  // });

  // const patients = [
  //   { name: 'Xavier Lim', id: 'SX1364X4F' },
  //   { name: 'Robert Tan', id: 'SX2468X4F' },
  //   { name: 'Hubert Ong', id: 'SX3692X4F' },
  // ];

  const [activeItem, setActiveItem] = useState(0);
  const footerItems = ['ImgGPT 2', 'ImgGPT 1', 'LIDAR'];

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const itemWidth = event.nativeEvent.layoutMeasurement.width / footerItems.length;
    const currentIndex = Math.round(scrollPosition / itemWidth);
    setActiveItem(currentIndex);
  };

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

  
  // const takePhoto = async () => {
  //   console.log('clicked');
  //   if (cameraRef.current) {
  //     const photo = await cameraRef.current.takePictureAsync();
  //     console.log('Photo taken:', photo.uri);
  //   }
  // };
  // const takePhoto = () => {
  //   console.log('clicked');
  //   Camera.takePictureAsync()
  // };

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
        // On web, we may be dealing with a blob or data URI
        filename = `image_${Date.now()}.jpg`;
      } else {
        // On native, get the filename from the path
        filename = localUri.split('/').pop();
      }
      
      // Determine the file type
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Append the image to the form data - handle web differently
      if (Platform.OS === 'web') {
        // For web, we need to handle the URI differently
        // This assumes localUri is either a blob or a data URI
        // We need to fetch it and convert to a blob if it's a data URI
        if (localUri.startsWith('data:')) {
          const response = await fetch(localUri);
          const blob = await response.blob();
          formData.append('image', blob, filename);
        } else {
          // Already a blob or file object
          formData.append('image', localUri, filename);
        }
      } else {
        // Native platforms
        formData.append('image', {
          uri: localUri,
          name: filename,
          type,
        });
      }
      
      // Append the patient ID
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
          
          // Upload the image to the server
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

  return (
    <View style={styles.container}>
        {/* Patient Info */}
        <View style={styles.patientInfo}>
            <TouchableOpacity style={styles.patientInfoHeader} onPress={toggleDropdown}>
                <Text style={styles.patientInfoTitle}>Selected Patient</Text>
                <Image source={require('./a008_assets/DropDownIcon.png')} style={styles.dropdownIcon} />
            </TouchableOpacity>

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
            {/* Dropdown Panel */}

            {dropdownVisible && (
            <View style={styles.dropdownPanel}>
                {patients.map((patient, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => selectPatient(patient)}
                >
                    {/* <Text style={styles.dropdownText}>{patient.name} - {patient.id}</Text> */}
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
            <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16} // Update scroll every 16 ms for smoother experience
            contentContainerStyle={styles.footerContentContainer}
            >
            {footerItems.map((item, index) => (
                <View key={index} style={[styles.footerItem, { width }]}>
                <Text style={[styles.footerText, activeItem === index && styles.activeFooterText]}>
                    {item}
                </Text>
                </View>
            ))}
            </ScrollView>

            {/* Capture Button */}
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.leftButtonsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Image source={require('./a008_assets/homeIcon.png')} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Print Preview')}>
                    <Image source={require('./a008_assets/screenshot.png')} style={styles.icon} />
                </TouchableOpacity>

            </View>


            <View style={styles.rightButtonsContainer}>
                {/* Flip Camera Button */}
                <TouchableOpacity onPress={toggleCameraFacing}>
                    <Image source={require('./a008_assets/flipCameraIcon.png')} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Printer Settings')}>
                    <Image source={require('./a008_assets/settingsIcon.png')} style={styles.icon} />
                </TouchableOpacity>
            </View>

            

          </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#272727',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 120,
    backgroundColor: '#272727',
    zIndex: 1,
  },
  patientInfo: {
    marginBottom: 15,
  },
  patientInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfoTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop:10,
    marginBottom: 10,
    textAlign: 'center',
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  patientInfoTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
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
  footerContentContainer: {
    flexDirection: 'row',
    alignItems: 'top',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  footerItem: {
    width:100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '400',
  },
  activeFooterText: {
    fontWeight: '700', // Highlight the active item
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
});

export default CameraPage;
