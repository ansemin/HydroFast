import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function BottomBar() {
  const navigation = useNavigation();

  return (
    <View style={styles.bottomBar}>
      {/* Add New Patient Button */}
      <Pressable 
        style={styles.addButton}
        onPress={() => navigation.navigate('New Patient Form')}
      >
        <Text style={styles.addButtonText}>
          Add New <Text style={styles.patientItalic}>Pat</Text>
          <Text style={styles.patientHighlight}>ient</Text>
        </Text>
      </Pressable>

      {/* Home Icon */}
      <Pressable onPress={() => navigation.navigate('Home')}>
        <Image 
          source={require('./../Screens/a004_assets/homeIcon.png')}
          style={styles.bottomIcon}
        />
      </Pressable>

      {/* Camera Icon */}
      <Image 
        source={require('./../Screens/a004_assets/cameraIcon.png')}
        style={styles.bottomIconMiddle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
