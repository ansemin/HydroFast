import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PatientCard from './a003b_PatientCard'; // Import the PatientCard component
import { HomeIcon, CameraIcon } from '../components/Icons';
import api from './../api';


const ScansFullList = () => {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    // Fetch scans from backend API
    api.get('/scans/')
      .then((response) => {
        setScans(response.data); 
      })
      .catch((error) => {
        console.error('Error fetching scans:', error);
      });
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoTextPrimary}>Hydro</Text>
        <Text style={styles.logoTextSecondary}>print</Text>
      </View>

      <Text style={styles.recentScansText}>Recent Scans</Text>

      {/* Patient Cards */}
      
      {scans.map((scan) => (
        <PatientCard
          key={scan.id}
          name={scan.patient_name}
          id={scan.patient.id}
          date={scan.date}
          time={scan.time}
        />
      ))}

      {/* <PatientCard name="Patient XX" id="SX1364X4F" date="24 Jun 2024" time="20:00" />
      <PatientCard name="Patient XY" id="SX1483X4F" date="20 Jun 2024" time="21:00" />
      <PatientCard name="Patient ZY" id="SX1387X4F" date="20 Jun 2024" time="18:15" />
      <PatientCard name="Patient ZY" id="SX1387X4F" date="20 Jun 2024" time="18:15" />
      <PatientCard name="Patient ZY" id="SX1387X4F" date="20 Jun 2024" time="18:15" />
      <PatientCard name="Patient ZY" id="SX1387X4F" date="20 Jun 2024" time="18:15" /> */}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarIconLeft} />
        {/* <View style={styles.bottomBarIcon} /> */}
        <HomeIcon />
        <CameraIcon />
        {/* <View style={styles.bottomBarIconMiddle} /> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    padding: 20,
    position: 'relative',
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
  recentScansText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
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
  bottomBarIcon: {
    width: 51,
    height: 46,
    backgroundColor: 'black',
  },
  bottomBarIconMiddle: {
    width: 49,
    height: 49,
    backgroundColor: 'black',
  },
});

export default ScansFullList;
