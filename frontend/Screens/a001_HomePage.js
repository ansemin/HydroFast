import React from 'react';
import { View } from 'react-native';
import { PatientsList } from './a004_PatientsList';

const HomePage = ({ navigation }) => {
  return (
    <PatientsList navigation={navigation} />
  );
};

export default HomePage;
