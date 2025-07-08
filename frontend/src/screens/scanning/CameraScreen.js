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
} 