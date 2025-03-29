import React from 'react';
import { Pressable, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Home Icon Component
export function HomeIcon() {
  const navigation = useNavigation();

  return (
    <Pressable onPress={() => navigation.navigate('Home')}>
      <Image 
        source={require('./../Screens/a004_assets/homeIcon.png')}
        style={styles.bottomIcon}
      />
    </Pressable>
  );
}

// Camera Icon Component
export function CameraIcon() {
  const navigation = useNavigation();
  return (
    <Pressable onPress={() => navigation.navigate('Camera Page')}>
      <Image 
        source={require('./../Screens/a004_assets/cameraIcon.png')}
        style={styles.bottomIconMiddle}
      />
    </Pressable>

  );
}


export function BackButton() {
  const navigation = useNavigation();

  return (
    <Pressable onPress={() => navigation.goBack()}>
      <Image 
        source={require('./../Screens/assets/backButton.png')}
        style={styles.bottomIcon}
      />
    </Pressable>
  );
}

export function SettingsIcon() {
  const navigation = useNavigation();

  return (
    <Pressable onPress={() => navigation.navigate('Printer Settings')}>
      <Image 
        source={require('./../Screens/assets/settingsIcon.png')}
        style={styles.bottomIcon}
      />
    </Pressable>
  );
}


export function PawPrint() {
  const navigation = useNavigation();

  return (
    <Image 
    source={require('./../Screens/assets/pawPrint.png')}
    style={styles.bottomIcon}
  />
    
    // <Pressable onPress={() => navigation.navigate('PawPrintScreen')}>
    //   <Image 
    //     source={require('./../Screens/assets/pawPrint.png')}
    //     style={styles.bottomIcon}
    //   />
    // </Pressable>
  );
}


export function PrintPawPrint() {
  const navigation = useNavigation();

  return (
    <Image 
    source={require('./../Screens/assets/pawPrint.png')}
    style={styles.bottomIcon}
  />
    
    // <Pressable onPress={() => navigation.navigate('PawPrintScreen')}>
    //   <Image 
    //     source={require('./../Screens/assets/pawPrint.png')}
    //     style={styles.bottomIcon}
    //   />
    // </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomIcon: {
    width: 51,
    height: 46,
  },
  bottomIconMiddle: {
    width: 49,
    height: 49,
  },
});
