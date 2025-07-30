import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { register } from '../../services';
import { BackArrowIcon } from '../../components/ui';

export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    console.log('[SignUpScreen] 📝 Registration form submission initiated');
    console.log(`[SignUpScreen] User data - Username: "${username}", Email: "${email}", Name: "${firstName} ${lastName}"`);
    
    // Basic validation
    if (!firstName || !lastName || !username || !email || !password || !retypePassword) {
      console.log('[SignUpScreen] ❌ Registration failed: Missing required fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== retypePassword) {
      console.log('[SignUpScreen] ❌ Registration failed: Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      console.log(`[SignUpScreen] ❌ Registration failed: Password too short (${password.length} characters)`);
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    console.log('[SignUpScreen] ✅ Form validation passed, starting registration process');
    setLoading(true);

    try {
      console.log(`[SignUpScreen] 🚀 Attempting to register user: "${username}" with email: "${email}"`);
      await register(username, email, password);
      console.log(`[SignUpScreen] ✅ Registration successful for user: "${username}"`);
      
      Alert.alert(
        'Success', 
        'Account created successfully! Please log in with your new credentials.',
        [
          { text: 'OK', onPress: () => {
            console.log('[SignUpScreen] User acknowledged success, navigating to Login screen');
            navigation.navigate('Login');
          }}
        ]
      );
    } catch (error) {
      console.error(`[SignUpScreen] ❌ Registration failed for user "${username}":`, error);
      
      if (error.code === 'ERR_NETWORK') {
        console.error('[SignUpScreen] Network error during registration');
        Alert.alert(
          "Network Error", 
          "Could not connect to the server. Please check your internet connection and make sure the server is running."
        );
      } else if (error.response) {
        console.error(`[SignUpScreen] Server error response (${error.response.status}):`, error.response.data);
        
        if (error.response.status === 400) {
          const errorMessage = error.response.data.error || error.response.data.message || "Invalid registration data. Please check your information.";
          console.error('[SignUpScreen] Invalid registration data:', errorMessage);
          Alert.alert("Registration Failed", errorMessage);
        } else if (error.response.status === 409) {
          console.error('[SignUpScreen] Username/email already exists');
          Alert.alert("Registration Failed", "This username or email is already taken. Please choose different credentials.");
        } else {
          console.error(`[SignUpScreen] Unexpected server error: ${error.response.status}`);
          Alert.alert(
            "Server Error", 
            `The server returned an error: ${error.response.status} ${error.response.statusText}`
          );
        }
      } else {
        console.error('[SignUpScreen] Unexpected registration error:', error.message);
        Alert.alert(
          "Registration Failed", 
          error.message || "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
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

      {/* Username Field */}
      <Text style={styles.usernameLabel}>Username</Text>
      <TextInput
        style={styles.usernameInput}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
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
      <TouchableOpacity 
        style={styles.signUpButton} 
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.signUpButtonText}>Sign up</Text>
        )}
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
    top: 580,
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

// Position styles for labels - adjusted for new username field
styles.firstNameLabel = { ...styles.label, top: 150 };
styles.firstNameInput = { ...styles.input, top: 169.95 };
styles.lastNameLabel = { ...styles.label, top: 219 };
styles.lastNameInput = { ...styles.input, top: 237.95 };
styles.usernameLabel = { ...styles.label, top: 288 };
styles.usernameInput = { ...styles.input, top: 305.95 };
styles.emailLabel = { ...styles.label, top: 357 };
styles.emailInput = { ...styles.input, top: 374.95 };
styles.passwordLabel = { ...styles.label, top: 426 };
styles.passwordInput = { ...styles.input, top: 443.95 };
styles.retypeLabel = { ...styles.label, top: 494.95 };
styles.retypeInput = { ...styles.input, top: 511.90 }; 