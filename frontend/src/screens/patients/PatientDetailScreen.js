import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  TextInput,
  Dimensions
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { patientService } from '../../services';

const { width, height } = Dimensions.get('window');

const PatientDetailScreen = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states for editing
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nric, setNric] = useState('');
  const [contactNo, setContactNo] = useState('');

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setIsLoading(true);
      const patientData = await patientService.getPatient(patientId);
      setPatient(patientData);
      
      // Set the form states
      setFirstName(patientData.first_name || '');
      setLastName(patientData.last_name || '');
      setNric(patientData.nric || '');
      setContactNo(patientData.contact_no || '');
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      Alert.alert('Error', 'Failed to load patient details.');
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updatedPatient = {
        first_name: firstName,
        last_name: lastName,
        nric: nric,
        contact_no: contactNo || null,
        details: '',
      };

      const result = await patientService.updatePatient(patientId, updatedPatient);
      setPatient(result);
      setIsEditing(false);
      
      Alert.alert(
        'Success', 
        'Patient details updated successfully!',
        [
          { 
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              setTimeout(() => {
                navigation.navigate('Patients List');
              }, 100);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      
      if (error.response && error.response.data) {
        const serverErrors = error.response.data;
        let errorMessage = "Failed to update patient:";
        Object.entries(serverErrors).forEach(([key, messages]) => {
          errorMessage += `\n• ${key}: ${messages.join(", ")}`;
        });
        Alert.alert("Error", errorMessage);
      } else {
        Alert.alert("Error", "Failed to update patient. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    setFirstName(patient.first_name || '');
    setLastName(patient.last_name || '');
    setNric(patient.nric || '');
    setContactNo(patient.contact_no || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this patient? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await patientService.deletePatient(patientId);
              Alert.alert('Success', 'Patient deleted successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Patients List') }
              ]);
            } catch (error) {
              console.error('Error deleting patient:', error);
              Alert.alert('Error', 'Failed to delete patient.');
            }
          }
        }
      ]
    );
  };

  const handleCamera = () => {
    navigation.navigate('Camera Page', { patientId });
  };

  const handleViewScans = () => {
    navigation.navigate('Scan Results', { patientId });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading patient details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
          <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
        </Svg>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Patient Detail</Text>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* First Name */}
        <Text style={styles.fieldLabel}>First Name</Text>
        <View style={styles.fieldContainer}>
          {isEditing ? (
            <TextInput
              style={styles.fieldInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
            />
          ) : (
            <Text style={styles.fieldValue}>{patient?.first_name}</Text>
          )}
        </View>

        {/* Last Name */}
        <Text style={styles.fieldLabel}>Last Name</Text>
        <View style={styles.fieldContainer}>
          {isEditing ? (
            <TextInput
              style={styles.fieldInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
            />
          ) : (
            <Text style={styles.fieldValue}>{patient?.last_name}</Text>
          )}
        </View>

        {/* NRIC/Passport No. */}
        <Text style={styles.fieldLabel}>NRIC/Passport No.</Text>
        <View style={styles.fieldContainer}>
          {isEditing ? (
            <TextInput
              style={styles.fieldInput}
              value={nric}
              onChangeText={setNric}
              placeholder="Enter NRIC/Passport No."
              maxLength={9}
            />
          ) : (
            <Text style={styles.fieldValue}>{patient?.nric}</Text>
          )}
        </View>

        {/* Contact No. */}
        <Text style={styles.fieldLabel}>Contact No. (Optional)</Text>
        <View style={styles.fieldContainer}>
          {isEditing ? (
            <TextInput
              style={styles.fieldInput}
              value={contactNo}
              onChangeText={setContactNo}
              placeholder="Enter contact number"
            />
          ) : (
            <Text style={styles.fieldValue}>{patient?.contact_no || ''}</Text>
          )}
        </View>

        {/* Scan Results Button */}
        <TouchableOpacity style={styles.scanResultsButton} onPress={handleViewScans}>
          <Text style={styles.scanResultsText}>Scan results</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cameraButton} onPress={handleCamera}>
                <Svg width="25" height="25" viewBox="0 0 25 25" fill="none">
                  <Path d="M0.809822 7.99373C0.287356 7.99373 0 7.69331 0 7.17085V3.814C0 1.2931 1.30617 0 3.85319 0H7.19697C7.7325 0 8.01985 0.287356 8.01985 0.809822C8.01985 1.31923 7.7325 1.61964 7.19697 1.61964H3.87931C2.41641 1.61964 1.61964 2.39028 1.61964 3.90543V7.17085C1.61964 7.69331 1.33229 7.99373 0.809822 7.99373ZM24.1902 7.99373C23.6677 7.99373 23.3804 7.69331 23.3804 7.17085V3.90543C23.3804 2.39028 22.5575 1.61964 21.1076 1.61964H17.79C17.2675 1.61964 16.9671 1.31923 16.9671 0.809822C16.9671 0.287356 17.2675 0 17.79 0H21.1468C23.6938 0 25 1.30617 25 3.814V7.17085C25 7.69331 24.7126 7.99373 24.1902 7.99373ZM6.55695 18.3777C5.25078 18.3777 4.58464 17.7247 4.58464 16.4316V9.44357C4.58464 8.15047 5.25078 7.48433 6.55695 7.48433H8.26803C8.80355 7.48433 8.96029 7.40596 9.27377 7.05329L9.83542 6.43939C10.175 6.06061 10.5016 5.90387 11.1416 5.90387H13.7539C14.4201 5.90387 14.7074 6.06061 15.0601 6.43939L15.6217 7.05329C15.9483 7.41902 16.105 7.48433 16.6275 7.48433H18.4561C19.7362 7.48433 20.4154 8.15047 20.4154 9.44357V16.4316C20.4154 17.7247 19.7362 18.3777 18.4561 18.3777H6.55695ZM12.5131 16.7842C14.6813 16.7842 16.4185 15.0862 16.4185 12.8657C16.4185 10.6844 14.6813 8.94723 12.5131 8.94723C10.3448 8.94723 8.59457 10.6844 8.59457 12.8657C8.59457 15.0601 10.3448 16.7842 12.5131 16.7842ZM17.7377 10.9848C18.1818 10.9848 18.5345 10.6322 18.5345 10.175C18.5214 9.73093 18.1818 9.3652 17.7377 9.3652C17.2936 9.3652 16.9279 9.73093 16.9279 10.175C16.9279 10.6322 17.2936 10.9848 17.7377 10.9848ZM12.5 15.8568C10.8542 15.8568 9.52194 14.5246 9.52194 12.8657C9.52194 11.2069 10.8542 9.87461 12.5 9.87461C14.1458 9.87461 15.4911 11.2069 15.4911 12.8657C15.4911 14.5246 14.1458 15.8568 12.5 15.8568ZM3.85319 25C1.30617 25 0 23.7069 0 21.1729V17.8292C0 17.3067 0.274295 17.0063 0.809822 17.0063C1.33229 17.0063 1.61964 17.3067 1.61964 17.8292V21.0946C1.61964 22.5967 2.41641 23.3804 3.87931 23.3804H7.19697C7.7325 23.3804 8.01985 23.6677 8.01985 24.1902C8.01985 24.6996 7.7325 25 7.19697 25H3.85319ZM17.79 25C17.2675 25 16.9671 24.6996 16.9671 24.1902C16.9671 23.6677 17.2675 23.3804 17.79 23.3804H21.1076C22.5575 23.3804 23.3804 22.5967 23.3804 21.0946V17.8292C23.3804 17.3067 23.6546 17.0063 24.1902 17.0063C24.6996 17.0063 25 17.3067 25 17.8292V21.1729C25 23.6938 23.6938 25 21.1468 25H17.79Z" fill="white"/>
                </Svg>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCFFF8',
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 18,
    padding: 10,
    zIndex: 1,
  },
  title: {
    position: 'absolute',
    left: 28,
    top: 70,
    color: 'black',
    fontSize: 22,
    fontFamily: 'Urbanist',
    fontWeight: '700',
  },
  formContainer: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fieldLabel: {
    color: '#707070',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '700',
    marginBottom: 3,
    width: 240,
    textAlign: 'left',
  },
  fieldContainer: {
    width: 240,
    height: 44,
    backgroundColor: '#EEEEEE',
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  fieldValue: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '400',
  },
  fieldInput: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '400',
    padding: 0,
    margin: 0,
  },
  scanResultsButton: {
    width: 240,
    height: 44,
    backgroundColor: '#EEEEEE',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  scanResultsText: {
    color: '#707070',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: '700',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    width: 240,
  },
  editButton: {
    width: 71,
    height: 44,
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraButton: {
    width: 71,
    height: 44,
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButton: {
    width: 71,
    height: 44,
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    width: 71,
    height: 44,
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    width: 71,
    height: 44,
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Urbanist',
    fontWeight: '700',
  },
});

export default PatientDetailScreen; 