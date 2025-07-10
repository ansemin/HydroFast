import React from 'react';
import { Pressable, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Path } from 'react-native-svg';

// Home Icon Component
export function HomeIcon() {
  const navigation = useNavigation();

  return (
    <Pressable onPress={() => navigation.navigate('Home')}>
      <Image 
        source={require('../assets/icons/homeIcon.png')}
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
      <Svg width="49" height="49" viewBox="0 0 25 25" fill="none">
        <Path d="M0.809822 7.99373C0.287356 7.99373 0 7.69331 0 7.17085V3.814C0 1.2931 1.30617 0 3.85319 0H7.19697C7.7325 0 8.01985 0.287356 8.01985 0.809822C8.01985 1.31923 7.7325 1.61964 7.19697 1.61964H3.87931C2.41641 1.61964 1.61964 2.39028 1.61964 3.90543V7.17085C1.61964 7.69331 1.33229 7.99373 0.809822 7.99373ZM24.1902 7.99373C23.6677 7.99373 23.3804 7.69331 23.3804 7.17085V3.90543C23.3804 2.39028 22.5575 1.61964 21.1076 1.61964H17.79C17.2675 1.61964 16.9671 1.31923 16.9671 0.809822C16.9671 0.287356 17.2675 0 17.79 0H21.1468C23.6938 0 25 1.30617 25 3.814V7.17085C25 7.69331 24.7126 7.99373 24.1902 7.99373ZM6.55695 18.3777C5.25078 18.3777 4.58464 17.7247 4.58464 16.4316V9.44357C4.58464 8.15047 5.25078 7.48433 6.55695 7.48433H8.26803C8.80355 7.48433 8.96029 7.40596 9.27377 7.05329L9.83542 6.43939C10.175 6.06061 10.5016 5.90387 11.1416 5.90387H13.7539C14.4201 5.90387 14.7074 6.06061 15.0601 6.43939L15.6217 7.05329C15.9483 7.41902 16.105 7.48433 16.6275 7.48433H18.4561C19.7362 7.48433 20.4154 8.15047 20.4154 9.44357V16.4316C20.4154 17.7247 19.7362 18.3777 18.4561 18.3777H6.55695ZM12.5131 16.7842C14.6813 16.7842 16.4185 15.0862 16.4185 12.8657C16.4185 10.6844 14.6813 8.94723 12.5131 8.94723C10.3448 8.94723 8.59457 10.6844 8.59457 12.8657C8.59457 15.0601 10.3448 16.7842 12.5131 16.7842ZM17.7377 10.9848C18.1818 10.9848 18.5345 10.6322 18.5345 10.175C18.5214 9.73093 18.1818 9.3652 17.7377 9.3652C17.2936 9.3652 16.9279 9.73093 16.9279 10.175C16.9279 10.6322 17.2936 10.9848 17.7377 10.9848ZM12.5 15.8568C10.8542 15.8568 9.52194 14.5246 9.52194 12.8657C9.52194 11.2069 10.8542 9.87461 12.5 9.87461C14.1458 9.87461 15.4911 11.2069 15.4911 12.8657C15.4911 14.5246 14.1458 15.8568 12.5 15.8568ZM3.85319 25C1.30617 25 0 23.7069 0 21.1729V17.8292C0 17.3067 0.274295 17.0063 0.809822 17.0063C1.33229 17.0063 1.61964 17.3067 1.61964 17.8292V21.0946C1.61964 22.5967 2.41641 23.3804 3.87931 23.3804H7.19697C7.7325 23.3804 8.01985 23.6677 8.01985 24.1902C8.01985 24.6996 7.7325 25 7.19697 25H3.85319ZM17.79 25C17.2675 25 16.9671 24.6996 16.9671 24.1902C16.9671 23.6677 17.2675 23.3804 17.79 23.3804H21.1076C22.5575 23.3804 23.3804 22.5967 23.3804 21.0946V17.8292C23.3804 17.3067 23.6546 17.0063 24.1902 17.0063C24.6996 17.0063 25 17.3067 25 17.8292V21.1729C25 23.6938 23.6938 25 21.1468 25H17.79Z" fill="black"/>
      </Svg>
    </Pressable>
  );
}


export function BackButton() {
  const navigation = useNavigation();

  return (
    <Pressable onPress={() => navigation.goBack()}>
      <Image 
        source={require('../assets/icons/backButton.png')}
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
        source={require('../assets/icons/settingsIcon.png')}
        style={styles.bottomIcon}
      />
    </Pressable>
  );
}


export function PawPrint() {
  const navigation = useNavigation();

  return (
    <Svg width="51" height="46" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9C22.1 9 23 9.9 23 11C23 12.1 22.1 13 21 13C19.9 13 19 12.1 19 11C19 9.9 19.9 9 21 9ZM3 9C4.1 9 5 9.9 5 11C5 12.1 4.1 13 3 13C1.9 13 1 12.1 1 11C1 9.9 1.9 9 3 9ZM16 7C17.1 7 18 7.9 18 9C18 10.1 17.1 11 16 11C14.9 11 14 10.1 14 9C14 7.9 14.9 7 16 7ZM8 7C9.1 7 10 7.9 10 9C10 10.1 9.1 11 8 11C6.9 11 6 10.1 6 9C6 7.9 6.9 7 8 7ZM12 12C16 12 19 15 19 19V22H5V19C5 15 8 12 12 12Z" fill="#666"/>
    </Svg>
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
