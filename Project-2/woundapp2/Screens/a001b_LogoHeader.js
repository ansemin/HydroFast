import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Reusable LogoHeader Component
const LogoHeader = () => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoTextPrimary}>Hydro</Text>
        <Text style={styles.logoTextSecondary}>print</Text>
      </View>
      {/* <TouchableOpacity style={styles.notificationIconContainer}>
        <View style={styles.notificationIcon} />
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
    // borderWidth: 1,        // Border width (you can adjust this value)
    // borderColor: '#626262', // Border color (adjust as needed)
    // borderStyle: 'solid',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  notificationIconContainer: {
    padding: 10,
  },
  notificationIcon: {
    width: 29.5,
    height: 31.36,
    backgroundColor: 'black', // You can replace this with an actual bell icon image later
  },
});

export default LogoHeader;
