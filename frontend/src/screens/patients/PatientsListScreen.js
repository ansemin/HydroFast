import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrollView, 
  KeyboardAvoidingView, 
  Pressable, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Keyboard, 
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { patientService, logout } from '../../services';
import { LogoHeader } from '../../components';
import { TextInput } from 'react-native-gesture-handler';
import { Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

const PatientListItem = ({ name, id, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.patientListItem}>
      <Text style={styles.patientName}>{name}</Text>
      <Text style={styles.patientId}>{id}</Text>
      <View style={styles.divider} />
    </TouchableOpacity>
  );
};

const PatientsListScreen = ({navigation, route}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch patients data
  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const patients = await patientService.getPatients();
      setPatients(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Refresh patient list when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Fetch patients when the screen comes into focus
      fetchPatients();
      
      return () => {
        // This is the cleanup function
        // No need to do anything here
      };
    }, []) // Empty dependency array means this only re-runs when the component mounts/unmounts
  );

  // Check if route and route.params exist before accessing route.params.refresh
  useEffect(() => {
    if (route && route.params && route.params.refresh) {
      fetchPatients();
      // Reset the parameter after use
      navigation.setParams({ refresh: undefined });
    }
  }, [route && route.params ? route.params.refresh : null]);

  const filteredPatients = (patients || []).filter((patient) => {
    const name = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const handlePressOutside = () => {
    if (!isInputFocused) {
      Keyboard.dismiss();
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // This will clear the auth tokens from AsyncStorage
      Alert.alert(
        "Logged Out",
        "You have been successfully logged out.",
        [{ text: "OK", onPress: () => navigation.replace('Login') }]
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePressOutside}>
      <View style={styles.container}>
        {/* Header with back/logout button and title */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleLogout}
          >
            <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
              <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
            </Svg>
          </TouchableOpacity>
          
          <Text style={styles.patientsListTitle}>Patients Directory</Text>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('New Patient Form')}
          >
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Path d="M1 7H13" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <Path d="M7 1L7 13" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          {/* Search Icon */}
          <Image
            source={require('../../assets/icons/searchIcon.png')}
            style={styles.searchIcon}
          />

          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search for patient"
            placeholderTextColor="dimgray"
            onChangeText={(text) => setSearchQuery(text)}
            value={searchQuery}
            underlineColorAndroid="transparent"
            onFocus={() => setIsInputFocused(true)} 
            onBlur={() => setIsInputFocused(false)} 
          />
        </View>

        {/* Patient list */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.patientListContainer}
        >
          {filteredPatients.map((patient) => (
            <PatientListItem
              key={patient.id}
              name={`${patient.first_name || ''} ${patient.last_name || ''}`}
              id={patient.nric}
              onPress={() => {
                // Navigate to Patient Detail page with patient ID
                navigation.navigate('Patient Detail', { patientId: patient.id });
              }}
            />
          ))}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FCFFF8',
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    marginLeft: -10,
    marginRight: -10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#707070',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  searchBarContainer: {
    width: '100%',
    height: 43,
    backgroundColor: '#ECECEC',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    marginBottom: 20,
  },
  searchIcon: {
    width: 23,
    height: 23,
    marginRight: 10,
  },
  searchInput: {
    width: '100%',
    fontSize: 16,
    fontFamily: 'Urbanist',
  },
  patientsListTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Urbanist',
  },
  patientListContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#EEEEEE',
    borderRadius: 13,
    padding: 10,
  },
  patientListItem: {
    width: '100%',
    paddingVertical: 10,
    marginBottom: 10,
    position: 'relative',
  },
  patientName: {
    fontSize: 12,
    color: '#707070',
    fontFamily: 'Urbanist',
    fontWeight: '700',
  },
  patientId: {
    fontSize: 14,
    color: '#707070',
    position: 'absolute',
    right: 0,
    top: 10,
    fontFamily: 'Urbanist',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
  },
});

export default PatientsListScreen; 