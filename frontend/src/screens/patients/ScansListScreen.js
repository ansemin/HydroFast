import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PatientCard, LogoHeader, HomeIcon, CameraIcon } from '../../components';
import { scanService } from '../../services';

const ScansListScreen = () => {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    // Fetch scans from backend API using service
    const fetchScans = async () => {
      try {
        const scansData = await scanService.getAllScans();
        setScans(scansData); 
      } catch (error) {
        console.error('Error fetching scans:', error);
      }
    };

    fetchScans();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.logoContainer}>
        <LogoHeader />
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

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarIconLeft} />
        <HomeIcon />
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
    padding: 20,
    position: 'relative',
  },
  logoContainer: {
    marginBottom: 20,
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
});

export default ScansListScreen; 