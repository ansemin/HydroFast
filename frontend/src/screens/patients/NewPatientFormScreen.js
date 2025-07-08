import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { patientService } from '../../services';

const { width, height } = Dimensions.get('window');

const NewPatientFormScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nric, setNric] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [errors, setErrors] = useState({});

  // Function to validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }

    if (!nric.trim()) {
      newErrors.nric = "NRIC/Passport No. is required";
      isValid = false;
    } else if (nric.length > 9) {
      newErrors.nric = "NRIC/Passport No. must be 9 characters or less";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Display the first error in an alert
      const firstError = Object.values(errors)[0];
      Alert.alert("Validation Error", firstError);
      return;
    }

    const patientData = {
      first_name: firstName,
      last_name: lastName,
      nric: nric,
      date_of_birth: null, // Optional field
      contact_no: contactNo || null, // Optional field
      details: '', // Optional field
    };

    try {
      await patientService.createPatient(patientData);
      console.log('Success, Patient added successfully!');
      Alert.alert('Success', 'Patient added successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Patients List') },
      ]);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error.response && error.response.data) {
        const serverErrors = error.response.data;
        console.error('Validation errors:', serverErrors);
        
        // Format server errors for display
        let errorMessage = "Failed to add patient:";
        Object.entries(serverErrors).forEach(([key, messages]) => {
          errorMessage += `\n• ${key}: ${messages.join(", ")}`;
        });
        
        Alert.alert("Error", errorMessage);
      } else {
        Alert.alert("Error", "Failed to add patient. Please try again.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formWrapper}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
            <Path 
              d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" 
              fill="black"
            />
          </Svg>
        </TouchableOpacity>

        {/* Form Header */}
        <Text style={styles.formHeader}>Add New Patient</Text>

        {/* Input Fields */}
        <Text style={styles.inputLabel}>First Name</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.inputField}
            placeholder="Enter first name"
            placeholderTextColor="#BBBBBB"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setErrors({...errors, firstName: null});
            }}
          />
        </View>
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

        <Text style={styles.inputLabel}>Last Name</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.inputField}
            placeholder="Enter last name"
            placeholderTextColor="#BBBBBB"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setErrors({...errors, lastName: null});
            }}
          />
        </View>
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

        <Text style={styles.inputLabel}>NRIC/Passport No.</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.inputField}
            placeholder="Enter NRIC/Passport No."
            placeholderTextColor="#BBBBBB"
            value={nric}
            maxLength={9}
            onChangeText={(text) => {
              setNric(text);
              setErrors({...errors, nric: null});
            }}
          />
        </View>
        {errors.nric && <Text style={styles.errorText}>{errors.nric}</Text>}

        <Text style={styles.inputLabel}>Contact No. (Optional)</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.inputField}
            placeholder="Enter contact number"
            placeholderTextColor="#BBBBBB"
            value={contactNo}
            onChangeText={setContactNo}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWrapper: {
    width: 320,
    height: 580,
    backgroundColor: '#FCFFF8',
    borderRadius: 30,
    padding: 20,
    paddingHorizontal: 40,
    paddingTop: 40,
    position: 'relative',
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  formHeader: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 15,
  },
  inputField: {
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    marginTop: -10,
  },
  submitButton: {
    backgroundColor: '#2864DA',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default NewPatientFormScreen; 