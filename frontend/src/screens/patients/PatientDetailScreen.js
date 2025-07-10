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
import { Svg, Path } from 'react-native-svg';
import { patientService } from '../../services';

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
      
      <ScrollView style={styles.contentContainer}>
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
            placeholder="Enter NRIC/Passport No."
            maxLength={9}
          />
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldValue}>{patient?.nric}</Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Contact No.</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={contactNo}
            onChangeText={setContactNo}
            placeholder="Enter contact number"
          />
        ) : (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldValue}>{patient?.contact_no || 'Not provided'}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={handleCamera}>
                <Text style={styles.cameraButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewScansButton} onPress={handleViewScans}>
                <Text style={styles.viewScansButtonText}>View Scans</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete Patient</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCFFF8',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 30,
    color: '#333',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
    color: '#333',
  },
  fieldContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 30,
    paddingBottom: 30,
  },
  editButton: {
    backgroundColor: '#2864DA',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraButton: {
    backgroundColor: '#17a2b8',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewScansButton: {
    backgroundColor: '#ffc107',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  viewScansButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PatientDetailScreen; 