import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, TouchableOpacity, Alert } from 'react-native';
import { NavigationButton } from './../components/NavigationButton';
import { logout } from '../api'; // Import logout function from api

import LogoHeader from './a001b_LogoHeader';
import { HomeIcon, CameraIcon } from '../components/Icons';


const patients = [
  { name: 'Xavier Lim', id: 'SX1364X4F', date: '24 Jun 2024', time: '20:00' },
  { name: 'Robert Tan', id: 'SX2468X4F', date: '20 Jun 2024', time: '21:00' },
  { name: 'Hubert Ong', id: 'SX3692X4F', date: '20 Jun 2024', time: '18:15' },
];

const PatientCard = ({ name, id, date, time }) => (
  <View style={styles.patientCard}>
    <Text style={styles.patientText}>{name}</Text>
    <Text style={styles.dateText}>{date}</Text>
    <Text style={styles.timeText}>{time}</Text>
  </View>
);


const HomePage = ({navigation}) => {
  const { width, height } = Dimensions.get('window');

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
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <LogoHeader/>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={styles.logoContainer}>
        <Text style={styles.logoTextPrimary}>Hydro</Text>
        <Text style={styles.logoTextSecondary}>print</Text>
      </View> */}

      <View style={styles.recentScansContainer}>
        <Text style={styles.recentScansText}>Recent Scans</Text>

        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            name={patient.name}
            date={patient.date}
            time={patient.time}
          />
        ))}

        {/* <View style={styles.button}>
          <Text style={styles.buttonText}>Add New <Text style={styles.highlightText}>Patient</Text></Text>
        </View> */}
        <NavigationButton 
          navigation={navigation}
          destination="New Patient Form"
          text="Add New"
          highlightedText="Patient"
          style={styles}
        />

        <NavigationButton 
          navigation={navigation}
          destination="Patients List"
          text="Patients"
          highlightedText="List"
          style={styles}
        />


        <Pressable
          onPress={() => navigation.navigate('Scans Page')}
          style={({ pressed }) => 
            pressed 
              ? [styles.fullListText, { color: '#841584' }] 
              : styles.fullListText
          }
        >
          <Text style={styles.fullListText}>See Full List</Text>
        </Pressable>

      </View>
      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarIconLeft} />
        <CameraIcon />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    justifyContent: 'flex-start',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 80,
  },
  logoutButton: {
    backgroundColor: '#2864DA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 80,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '400',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 20,
  },
  logoTextPrimary: {
    color: '#2864DA',
    fontSize: 30,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  logoTextSecondary: {
    color: '#0D2B64',
    fontSize: 30,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  recentScansContainer: {
    marginTop: 50,
  },
  recentScansText: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: 'black',
    marginBottom: 20,
  },
  patientCard: {
    width: '100%',
    height: 70,
    backgroundColor: 'rgba(217, 217, 217, 0.50)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    marginBottom: 15,
    padding: 10,
  },
  patientText: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#707070',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#707070',
    position: 'absolute',
    right: 20,
    top: 10,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#707070',
    position: 'absolute',
    right: 20,
    bottom: 10,
  },
  button: {
    backgroundColor: '#2864DA',
    borderRadius: 5,
    width: 150,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: 'white',
  },
  highlightText: {
    fontStyle: 'italic',
    color: '#6CFF9A',
  },
  fullListText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
    fontStyle: 'italic',
    color: '#2864DA',
    marginTop: 20,
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
  bottomBarIconLeft: {
    width: 51,
    height: 46,
  },
});

export default HomePage;
