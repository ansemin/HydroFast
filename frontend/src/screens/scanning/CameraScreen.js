import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button, Image, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
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
      mediaTypes: ['images'],
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
    <Svg width="50" height="50" viewBox="0 0 50 50">
      <Circle cx="25" cy="25" r="25" fill="white" />
      <Circle cx="25" cy="25" r="18" fill="#2196F3" />
    </Svg>
  );

  const FlipIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <Path d="M17.6742 0.201618C17.5452 0.0725242 17.3701 0 17.1875 0C17.0049 0 16.8298 0.0725242 16.7008 0.201618C16.5717 0.330712 16.4991 0.505802 16.4991 0.688368C16.4991 0.870935 16.5717 1.04602 16.7008 1.17512L18.2779 2.75087H2.75C2.02065 2.75087 1.32118 3.0406 0.805456 3.55632C0.289731 4.07205 0 4.77152 0 5.50087V14.4384C0 14.6207 0.072433 14.7956 0.201364 14.9245C0.330295 15.0534 0.505164 15.1259 0.6875 15.1259C0.869836 15.1259 1.0447 15.0534 1.17364 14.9245C1.30257 14.7956 1.375 14.6207 1.375 14.4384V5.50087C1.375 5.1362 1.51987 4.78646 1.77773 4.5286C2.03559 4.27073 2.38533 4.12587 2.75 4.12587H18.2779L16.7008 5.70162C16.5717 5.83071 16.4991 6.0058 16.4991 6.18837C16.4991 6.37093 16.5717 6.54602 16.7008 6.67512C16.8298 6.80421 17.0049 6.87674 17.1875 6.87674C17.3701 6.87674 17.5452 6.80421 17.6742 6.67512L20.4242 3.92512C20.4883 3.86126 20.5391 3.78539 20.5737 3.70186C20.6084 3.61834 20.6262 3.5288 20.6262 3.43837C20.6262 3.34794 20.6084 3.2584 20.5737 3.17487C20.5391 3.09135 20.4883 3.01548 20.4242 2.95162L17.6742 0.201618ZM19.25 17.8759C19.6147 17.8759 19.9644 17.731 20.2223 17.4731C20.4801 17.2153 20.625 16.8655 20.625 16.5009V7.56337C20.625 7.38103 20.6974 7.20616 20.8264 7.07723C20.9553 6.9483 21.1302 6.87587 21.3125 6.87587C21.4948 6.87587 21.6697 6.9483 21.7986 7.07723C21.9276 7.20616 22 7.38103 22 7.56337V16.5009C22 17.2302 21.7103 17.9297 21.1945 18.4454C20.6788 18.9611 19.9793 19.2509 19.25 19.2509H3.72212L5.29925 20.8266C5.42834 20.9557 5.50087 21.1308 5.50087 21.3134C5.50087 21.4959 5.42834 21.671 5.29925 21.8001C5.17016 21.9292 4.99507 22.0017 4.8125 22.0017C4.62993 22.0017 4.45484 21.9292 4.32575 21.8001L1.57575 19.0501C1.51173 18.9863 1.46093 18.9104 1.42627 18.8269C1.39161 18.7433 1.37377 18.6538 1.37377 18.5634C1.37377 18.4729 1.39161 18.3834 1.42627 18.2999C1.46093 18.2163 1.51173 18.1405 1.57575 18.0766L4.32575 15.3266C4.38967 15.2627 4.46556 15.212 4.54907 15.1774C4.63259 15.1428 4.7221 15.125 4.8125 15.125C4.9029 15.125 4.99241 15.1428 5.07593 15.1774C5.15944 15.212 5.23533 15.2627 5.29925 15.3266C5.36317 15.3905 5.41388 15.4664 5.44847 15.5499C5.48306 15.6335 5.50087 15.723 5.50087 15.8134C5.50087 15.9038 5.48306 15.9933 5.44847 16.0768C5.41388 16.1603 5.36317 16.2362 5.29925 16.3001L3.72212 17.8759H11.4861H19.25ZM15.125 11.0009C15.125 12.0949 14.6904 13.1441 13.9168 13.9177C13.1432 14.6913 12.094 15.1259 11 15.1259C9.90598 15.1259 8.85677 14.6913 8.08318 13.9177C7.3096 13.1441 6.875 12.0949 6.875 11.0009C6.875 9.90685 7.3096 8.85764 8.08318 8.08405C8.85677 7.31047 9.90598 6.87587 11 6.87587C12.094 6.87587 13.1432 7.31047 13.9168 8.08405C14.6904 8.85764 15.125 9.90685 15.125 11.0009ZM13.75 11.0009C13.75 10.2715 13.4603 9.57205 12.9445 9.05632C12.4288 8.5406 11.7293 8.25087 11 8.25087C10.2707 8.25087 9.57118 8.5406 9.05546 9.05632C8.53973 9.57205 8.25 10.2715 8.25 11.0009C8.25 11.7302 8.53973 12.4297 9.05546 12.9454C9.57118 13.4611 10.2707 13.7509 11 13.7509C11.7293 13.7509 12.4288 13.4611 12.9445 12.9454C13.4603 12.4297 13.75 11.7302 13.75 11.0009Z" fill="white"/>
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
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
    paddingBottom: 10,
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
    width: 50,
    height: 50,
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