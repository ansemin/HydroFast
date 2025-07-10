import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button, Image, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import { useNavigation, useRoute } from '@react-navigation/native';
import { patientService, scanService } from '../../services';

const { width } = Dimensions.get('window');

const CameraScreen = () => {
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
    patientService.getPatients()
      .then((fetchedPatients) => {
        console.log(fetchedPatients)
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

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        if (!selectedPatient) {
          Alert.alert('Error', 'Please select a patient before taking a photo.');
          return;
        }

        const photo = await cameraRef.current.takePictureAsync();
        const savedImagePath = await saveImage(photo.uri);
        
        if (savedImagePath) {
          // Navigate to photo preview with the saved image path
          navigation.navigate('Photo Preview', {
            imageUri: savedImagePath,
            patientId: selectedPatient.id,
            patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
            cameFromPatientDetail
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture.');
      }
    }
  };

  const pickImage = async () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient before selecting an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const savedImagePath = await saveImage(result.assets[0].uri);
      if (savedImagePath) {
        navigation.navigate('Photo Preview', {
          imageUri: savedImagePath,
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
          cameFromPatientDetail
        });
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setDropdownVisible(false);
  };

  const BackIcon = () => (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="white"/>
    </Svg>
  );

  const CameraIcon = () => (
    <Svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <Path d="M30 45C37.7319 45 44 38.7319 44 31C44 23.2681 37.7319 17 30 17C22.2681 17 16 23.2681 16 31C16 38.7319 22.2681 45 30 45Z" fill="white"/>
      <Path d="M30 41C35.5228 41 40 36.5228 40 31C40 25.4772 35.5228 21 30 21C24.4772 21 20 25.4772 20 31C20 36.5228 24.4772 41 30 41Z" fill="#2196F3"/>
    </Svg>
  );

  const FlipIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M9 12L14 7V10H20V14H14V17L9 12Z" fill="white"/>
      <Path d="M4 5V19L6 17V7H14L16 5H4Z" fill="white"/>
    </Svg>
  );

  const GalleryIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="white"/>
    </Svg>
  );

  const DropdownIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M7 10L12 15L17 10H7Z" fill="white"/>
    </Svg>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Photo</Text>
      </View>

      {/* Patient Selection */}
      <View style={styles.patientSelection}>
        <TouchableOpacity style={styles.dropdown} onPress={toggleDropdown}>
          <Text style={styles.dropdownText}>
            {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Select Patient'}
          </Text>
          <DropdownIcon />
        </TouchableOpacity>
        
        {dropdownVisible && (
          <View style={styles.dropdownMenu}>
            <ScrollView style={styles.dropdownScroll}>
              {patients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.dropdownItem}
                  onPress={() => selectPatient(patient)}
                >
                  <Text style={styles.dropdownItemText}>
                    {patient.first_name} {patient.last_name}
                  </Text>
                  <Text style={styles.dropdownItemSubtext}>
                    {patient.nric}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
          <GalleryIcon />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <CameraIcon />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <FlipIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientSelection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#000',
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
  },
  dropdownText: {
    color: 'white',
    fontSize: 16,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#000',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
});

export default CameraScreen; 