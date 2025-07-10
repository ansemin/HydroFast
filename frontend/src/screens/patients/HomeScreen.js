import React from 'react';
import { View } from 'react-native';
import PatientsListScreen from './PatientsListScreen';

const HomeScreen = ({ navigation }) => {
  return (
    <PatientsListScreen navigation={navigation} />
  );
};

export default HomeScreen; 