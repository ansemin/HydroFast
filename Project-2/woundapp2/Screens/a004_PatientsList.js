import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Pressable, View, Text, StyleSheet, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import api from './../api';

import LogoHeader from './a001b_LogoHeader';
import NavigationButton from './../components/NavigationButton';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomePage from './a001_HomePage';
import { TextInput } from 'react-native-gesture-handler';
import { HomeIcon, CameraIcon } from '../components/Icons';

// const patients = [
//   { name: 'Xavier Lim', id: 'SX1364X4F' },
//   { name: 'Robert Tan', id: 'SX2468X4F' },
//   { name: 'Hubert Ong', id: 'SX3692X4F' },
//   // Add more patients here
// ];


const PatientListItem = ({ name, id }) => {
  return (
    <View style={styles.patientListItem}>
      <Text style={styles.patientName}>{name}</Text>
      <Text style={styles.patientId}>{id}</Text>
      <View style={styles.divider} />
    </View>
  );
};

const PatientsList = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    // Fetch patients from backend API
    api.get('/patients/')
      .then((response) => {
        console.log('updating')
        // Only update state if data has changed
        setPatients((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(response.data)) {
            return response.data;
          }
          return prev;
        });
      })
      .catch((error) => {
        console.error('Error fetching patients:', error);
      });
  }, []);



  const filteredPatients = (patients || []).filter((patient) => {
    console.log(patients)
    const name = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handlePressOutside = () => {
    if (!isInputFocused) {
      Keyboard.dismiss();
    }
  };


  return (
     <Pressable onPress={handlePressOutside} style={{ flex: 1 }} accessible={false}>
      <View style={styles.container}>
        {/* Header */}
        <LogoHeader />

        {/* Search Bar */}

        <View style={styles.searchBarContainer}>
          {/* Search Icon */}
          <Image
            source={require('./a004_assets/searchIcon.png')}
            style={styles.searchIcon}
          />

          {/* Search Input */}
          <TextInput
          style={styles.searchInput}
          placeholder="Search for patients"
          placeholderTextColor="dimgray"
          onChangeText={(text) => setSearchQuery(text)}
          value={searchQuery}
          underlineColorAndroid="transparent"
          onFocus={() => setIsInputFocused(true)} 
          onBlur={() => setIsInputFocused(false)} 
          />

        </View>

        <Text style={styles.patientsListTitle}>Patients List</Text>

        {/* Patients List */}
        <View style={styles.patientListContainer}>
          {filteredPatients.map((patient) => (
            <PatientListItem
              key={patient.id}
              name={`${patient.first_name || ''} ${patient.last_name || ''}`}
              id={patient.nric}
            />
          ))}
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Pressable 
          style={styles.addButton}
          onPress={() => navigation.navigate('New Patient Form')}
          >
            <Text style={styles.addButtonText}>
              Add New <Text style={styles.patientItalic}>Pat</Text><Text style={styles.patientHighlight}>ient</Text>
            </Text>
          </Pressable>

          <HomeIcon/>
          <CameraIcon/>
        </View>
      </View>

     </Pressable>

  );
};

const Tab = createBottomTabNavigator();

const PatientsStack = ({navigation})=> (
  <Tab.Navigator initialRouteName='Patients List'>
    <Tab.Screen name="New Patient Form" component={NewPatientForm} />
    <Tab.Screen name="Home" component={HomePage}/>
    <Tab.Screen name="Patients List" component={PatientsList} />

  </Tab.Navigator>
)


const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    padding: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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
  searchBarContainer: {
    width: '100%',
    height: 43,
    backgroundColor: '#ECECEC',
    borderRadius: 5,
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
    fontSize: 20,
  },
  searchPlaceholder: {
    fontSize: 20,
    color: '#626262',
  },
  patientsListTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  patientListContainer: {
    width: '100%',
    height: 350,
  },
  patientListItem: {
    width: '100%',
    height: 31,
    marginBottom: 10,
    position: 'relative',
  },
  patientName: {
    fontSize: 20,
    color: 'black',
  },
  patientId: {
    fontSize: 16,
    color: 'black',
    position: 'absolute',
    right: 0,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'black',
    position: 'absolute',
    bottom: 0,
  },
  bottomBar: {
    width: '100%',
    height: 70,
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2864DA',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  addButtonText: {
    fontSize: 15,
    color: 'white',
  },
  patientItalic: {
    fontStyle: 'italic',
  },
  patientHighlight: {
    color: '#6CFF9A',
  },
  bottomIcon: {
    width: 51,
    height: 46,
  },
  bottomIconMiddle: {
    width: 49,
    height: 49,
  },
});

export { PatientsList };
