import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import api from '../api';
import Svg, { Path } from 'react-native-svg';

const PatientDetail = ({ route, navigation }) => {
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
      const response = await api.get(`/patients/${patientId}/`);
      setPatient(response.data);
      
      // Set the form states
      setFirstName(response.data.first_name || '');
      setLastName(response.data.last_name || '');
      setNric(response.data.nric || '');
      setContactNo(response.data.contact_no || '');
      
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

      const response = await api.put(`/patients/${patientId}/`, updatedPatient);
      
      if (response.status === 200) {
        setPatient(response.data);
        setIsEditing(false);
        
        // Show success message without automatic navigation
        Alert.alert(
          'Success', 
          'Patient details updated successfully!',
          [
            { 
              text: 'OK',
              onPress: () => {
                // First go back to ensure we're on the Patients List screen
                navigation.goBack();
                // Then use a timeout to allow the first navigation to complete
                setTimeout(() => {
                  // Refresh the patients list
                  navigation.navigate('Patients List');
                }, 100);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      
      if (error.response && error.response.data) {
        const serverErrors = error.response.data;
        
        // Format server errors for display
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
    // Reset form states to original values
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
              await api.delete(`/patients/${patientId}/`);
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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
            <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
          </Svg>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Patient Detail</Text>
        
        <Text style={styles.fieldLabel}>First Name</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
          />
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldValue}>{patient?.first_name}</Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Last Name</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
          />
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldValue}>{patient?.last_name}</Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>NRIC/Passport No.</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={nric}
            onChangeText={setNric}
            placeholder="Enter NRIC/Passport number"
          />
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldValue}>{patient?.nric}</Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Contact No. (Optional)</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={contactNo}
            onChangeText={setContactNo}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
          />
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldValue}>{patient?.contact_no || 'Not provided'}</Text>
          </View>
        )}

        <View style={styles.buttonsSection}>
          <TouchableOpacity 
            style={styles.scanResultsButton}
            onPress={handleViewScans}
          >
            <Text style={styles.scanResultsButtonText}>Scan results</Text>
          </TouchableOpacity>

          <View style={styles.actionButtonsContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEdit}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={handleCamera}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z" fill="black"/>
                    <Path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="black"/>
                  </Svg>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
    fontFamily: 'Urbanist',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCFFF8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  contentContainer: {
    padding: 20,
    paddingHorizontal: 30,
    paddingTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Urbanist',
    marginBottom: 15,
    color: '#000000',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#707070',
    marginBottom: 4,
    fontFamily: 'Urbanist',
  },
  fieldContainer: {
    backgroundColor: '#EEEEEE',
    borderRadius: 13,
    padding: 10,
    marginBottom: 15,
  },
  fieldValue: {
    fontSize: 16,
    color: '#707070',
    fontFamily: 'Urbanist',
  },
  input: {
    backgroundColor: '#EEEEEE',
    borderRadius: 13,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Urbanist',
  },
  buttonsSection: {
    marginTop: 20,
  },
  scanResultsButton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 13,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanResultsButtonText: {
    color: '#707070',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Urbanist',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 13,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
  },
  editButton: {
    backgroundColor: '#27CFA0',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#27CFA0',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#27CFA0',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    marginLeft: 10,
  },
  cameraButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Urbanist',
  },
});

export default PatientDetail; 