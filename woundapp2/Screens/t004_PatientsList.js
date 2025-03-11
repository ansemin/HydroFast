import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BgGroup from './t004_assets/BgGroup';
import Line from './t004_assets/Line';
import Vector from './t004_assets/Vector';

export default function IPhoneSe() {
  return (
    <View style={styles.container}>
      <View style={styles.hydroprintContainer}>
        <Text style={styles.hydroprintText}>
          <Text style={styles.hydroText}>Hydro</Text>
          <Text style={styles.printText}>print</Text>
        </Text>
      </View>
      <View style={styles.patientsListContainer}>
        <Text style={styles.patientsListText}>Patients List (Admin)</Text>
      </View>
      <View style={styles.searchContainer}>
        <Vector style={styles.vectorIcon} />
        <Text style={styles.searchText}>Search for patient</Text>
      </View>

      {/* List of Patients */}
      {[...Array(10)].map((_, index) => (
        <View key={index} style={styles.patientContainer}>
          <Text style={styles.patientName}>Patient XX</Text>
          <Text style={styles.patientCode}>SX1364X4F</Text>
          <Line style={styles.line} />
        </View>
      ))}

      <View style={styles.addPatientContainer}>
        <BgGroup style={styles.bgGroup} />
        <View style={styles.addNewPatientButton}>
          <Text style={styles.addNewPatientText}>
            Add <Text style={styles.newText}>New</Text> Patient
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 5,
    alignItems: 'center',
    fontFamily: 'sans-serif',
  },
  hydroprintContainer: {
    paddingHorizontal: 17,
    alignItems: 'center',
  },
  hydroprintText: {
    fontSize: 30,
    fontWeight: '700',
  },
  hydroText: {
    color: 'royalblue',
  },
  printText: {
    fontStyle: 'italic',
    color: 'midnightblue',
  },
  patientsListContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 19,
    paddingVertical: 8,
  },
  patientsListText: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    backgroundColor: 'whitesmoke',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vectorIcon: {
    width: 27,
    height: 27,
    marginRight: 10,
  },
  searchText: {
    fontSize: 20,
    color: 'dimgray',
  },
  patientContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    width: '100%',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 20,
  },
  patientCode: {
    fontSize: 16,
    color: 'gray',
  },
  line: {
    height: 1,
    width: '90%',
    backgroundColor: 'lightgray',
    marginTop: 8,
  },
  addPatientContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
    width: '100%',
  },
  bgGroup: {
    position: 'absolute',
    width: 320,
    bottom: -11,
    zIndex: 0,
  },
  addNewPatientButton: {
    backgroundColor: 'royalblue',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
  },
  addNewPatientText: {
    textAlign: 'center',
    fontSize: 15,
    color: 'white',
  },
  newText: {
    fontStyle: 'italic',
    color: 'mediumspringgreen',
  },
});
