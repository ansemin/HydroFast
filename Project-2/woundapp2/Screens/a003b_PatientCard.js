import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PatientCard = ({ name, id, date, time }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.id}>{id}</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.time}>{time}</Text>
      <Pressable
      onPress={() => navigation.navigate('Print Preview')}
      >
        <Image 
            source={require('./a003_assets/smallPaw.png')} 
            style={styles.pawIcon} 
          />
      </Pressable>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 75,
    backgroundColor: 'rgba(217, 217, 217, 0.50)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6B6B6B',
    padding: 10,
    marginBottom: 15,
    position: 'relative',
  },
  name: {
    fontSize: 20,
    fontWeight: '400',
    color: 'black',
  },
  id: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginTop: 5,
  },
  date: {
    fontSize: 20,
    fontWeight: '400',
    color: 'black',
    position: 'absolute',
    right: 60,
    top: 10,
  },
  time: {
    fontSize: 20,
    fontWeight: '400',
    color: 'black',
    position: 'absolute',
    right: 60,
    bottom: 10,
  },
  pawIcon: {
    width: 30,
    height: 30,
    position: 'absolute',
    right: 5,
    bottom: 5,
  },
});

export default PatientCard;
