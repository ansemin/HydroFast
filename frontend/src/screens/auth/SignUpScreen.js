import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Back Arrow Component using the provided SVG
function BackArrowIcon() {
  return (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
    </Svg>
  );
}

export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');

  const handleSignUp = () => {
    // Basic validation
    if (!firstName || !lastName || !email || !password || !retypePassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== retypePassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // TODO: Implement actual sign up logic
    Alert.alert('Success', 'Account created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <BackArrowIcon />
      </TouchableOpacity>

      {/* Sign up Title */}
      <Text style={styles.title}>Sign up</Text>

      {/* First Name Field */}
      <Text style={styles.firstNameLabel}>First Name</Text>
      <TextInput
        style={styles.firstNameInput}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {/* Last Name Field */}
      <Text style={styles.lastNameLabel}>Last Name</Text>
      <TextInput
        style={styles.lastNameInput}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {/* Email Field */}
      <Text style={styles.emailLabel}>Email</Text>
      <TextInput
        style={styles.emailInput}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Password Field */}
      <Text style={styles.passwordLabel}>Password</Text>
      <TextInput
        style={styles.passwordInput}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Retype Password Field */}
      <Text style={styles.retypeLabel}>Retype</Text>
      <TextInput
        style={styles.retypeInput}
        value={retypePassword}
        onChangeText={setRetypePassword}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
    paddingHorizontal: 20,
    borderRadius: 30,
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    left: 18,
    top: 60,
    padding: 10,
  },
  title: {
    position: 'absolute',
    left: 70,
    top: 100,
    color: '#000000',
    fontSize: 22,
    fontFamily: 'Urbanist-Bold',
    fontWeight: '700',
  },
  label: {
    position: 'absolute',
    left: 70,
    color: '#707070',
    fontSize: 12,
    fontFamily: 'Urbanist-Bold',
    fontWeight: '700',
  },
  input: {
    position: 'absolute',
    left: 70,
    width: 240,
    height: 44,
    backgroundColor: '#EEEEEE',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: 'Urbanist-Regular',
    fontSize: 14,
    color: '#000000',
  },
  signUpButton: {
    position: 'absolute',
    left: 70,
    top: 510,
    width: 240,
    height: 44,
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#70E7BB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    elevation: 4,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Urbanist-Bold',
    fontWeight: '700',
  },
});

// Position styles for labels - matching the HTML specifications
styles.firstNameLabel = { ...styles.label, top: 150 };
styles.firstNameInput = { ...styles.input, top: 169.95 };
styles.lastNameLabel = { ...styles.label, top: 219 };
styles.lastNameInput = { ...styles.input, top: 237.95 };
styles.emailLabel = { ...styles.label, top: 288 };
styles.emailInput = { ...styles.input, top: 305.95 };
styles.passwordLabel = { ...styles.label, top: 357 };
styles.passwordInput = { ...styles.input, top: 373.95 };
styles.retypeLabel = { ...styles.label, top: 424.95 };
styles.retypeInput = { ...styles.input, top: 441.90 };

// Update component to use positioned styles
export { SignUpScreen }; 