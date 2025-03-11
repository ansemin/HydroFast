import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import LogoHeader from './a001b_LogoHeader';

import api from './../api';

const NewPatientForm = ({navigation}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nric, setNric] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(''); 
  const [details, setDetails] = useState(''); 

  // Function to handle form submission
  const handleSubmit = async () => {
    const payload = {
      first_name: firstName,
      last_name: lastName,
      nric: nric,
      date_of_birth: null, // Optional field, provide null if not entered
      contact_no: contactNo || null, // Optional field
      details: '', // Optional field, default to empty string
    };

    try {
      const response = await api.post('/patients/', payload); // Endpoint to add a new patient
      if (response.status === 201) {
        console.log('Success, Patient added successfully!')
        Alert.alert('Success', 'Patient added successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Patients List') },
        ]);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('Validation errors:', error.response.data);
      } else {
        console.error('Error adding patient:', error);
      }
      Alert.alert('Error', 'Failed to add patient. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LogoHeader/>

      {/* Form Header */}
      <Text style={styles.formHeader}>Add New Patient</Text>

      {/* Input Fields */}
      <Text style={styles.inputLabel}>First Name</Text>
      <TextInput
        style={styles.inputField}
        placeholder="Enter first name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <Text style={styles.inputLabel}>Last Name</Text>
      <TextInput
        style={styles.inputField}
        placeholder="Enter last name"
        value={lastName}
        onChangeText={setLastName}
      />

      <Text style={styles.inputLabel}>NRIC/Passport No.</Text>
      <TextInput
        style={styles.inputField}
        placeholder="Enter NRIC/Passport No."
        value={nric}
        onChangeText={setNric}
      />

      <Text style={styles.inputLabel}>Contact No. (Optional)</Text>
      <TextInput
        style={styles.inputField}
        placeholder="Enter contact number"
        value={contactNo}
        onChangeText={setContactNo}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>

      {/* Patients List Button */}

      <Pressable
        style={styles.patientsListButton}
        onPress={() => navigation.navigate('Patients List')}
      >
        <Text style={styles.patientsListButtonText}>
          <Text style={styles.patientTextItalic}>Pat</Text>
          <Text style={styles.patientTextHighlight}>ients</Text> List
        </Text>
      </Pressable>


      {/* Upload Section */}
      {/* <View style={styles.uploadSection}>
        <Image 
          style={styles.uploadImage}
          source={{ uri: 'https://via.placeholder.com/168x60' }} 
        />
        <View style={styles.orDividerLeft} />
        <View style={styles.orDividerRight} />
        <Text style={styles.orText}>OR</Text>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    position: 'relative',
  },
  logoContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 30,
  },
  logoTextPrimary: {
    color: '#2864DA',
    fontSize: 30,
    fontWeight: '700',
  },
  logoTextSecondary: {
    color: '#0D2B64',
    fontSize: 30,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  notificationIconContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
  },
  notificationIcon: {
    width: 29.5,
    height: 34.89,
    backgroundColor: 'black',
  },
  formHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    color: 'black',
    marginBottom: 5,
  },
  inputField: {
    width: '100%',
    height: 41,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  submitButton: {
    width: 74,
    height: 33,
    backgroundColor: '#2864DA',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 15,
  },
  patientsListButton: {
    width: 111,
    height: 36,
    backgroundColor: '#2864DA',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientsListButtonText: {
    color: 'white',
    fontSize: 15,
  },
  patientTextItalic: {
    fontStyle: 'italic',
  },
  patientTextHighlight: {
    color: '#6CFF9A',
  },
  uploadSection: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadImage: {
    width: 168,
    height: 60,
    marginRight: 10,
  },
  orDividerLeft: {
    width: 117,
    height: 1,
    backgroundColor: 'black',
    marginRight: 10,
  },
  orDividerRight: {
    width: 116,
    height: 1,
    backgroundColor: 'black',
    marginLeft: 10,
  },
  orText: {
    fontSize: 15,
    color: 'black',
    fontWeight: '400',
  },
});

export default NewPatientForm;
