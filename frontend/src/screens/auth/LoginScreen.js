import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Keyboard, 
  TouchableWithoutFeedback, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { login, register, isAuthenticated } from '../../services';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';

export default function LoginScreen({ className = "" }) {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // New state for signup form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        navigation.replace('Home');
      }
    };
    
    checkAuth();
  }, []);

  const handleAuth = async () => {
    if (isRegistering) {
      // Validation for signup form
      if (!firstName) {
        Alert.alert("Error", "Please enter your first name");
        return;
      }
      
      if (!lastName) {
        Alert.alert("Error", "Please enter your last name");
        return;
      }
      
      if (!email) {
        Alert.alert("Error", "Please enter your email");
        return;
      }
      
      if (!password) {
        Alert.alert("Error", "Please enter your password");
        return;
      }
      
      if (!retypePassword) {
        Alert.alert("Error", "Please retype your password");
        return;
      }
      
      if (password !== retypePassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      // Generate username from email if not provided
      const usernameToUse = username || email.split('@')[0];
      
      setLoading(true);
      
      try {
        await register(usernameToUse, email, password);
        Alert.alert("Success", "Registration successful!");
        setIsRegistering(false);
        clearForm();
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 'ERR_NETWORK') {
          Alert.alert(
            "Network Error", 
            "Could not connect to the server. Please check your internet connection and make sure the server is running."
          );
        } else if (error.response) {
          if (error.response.status === 400) {
            Alert.alert(
              "Registration Failed", 
              error.response.data.error || "Invalid information. Please check your details."
            );
          } else {
            Alert.alert(
              "Server Error", 
              `The server returned an error: ${error.response.status} ${error.response.statusText}`
            );
          }
        } else {
          Alert.alert(
            "Registration Failed", 
            error.message || "An unexpected error occurred. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Original login logic
      if (!email) {
        Alert.alert("Error", "Please enter your email");
        return;
      }
      
      if (!password) {
        Alert.alert("Error", "Please enter your password");
        return;
      }

      setLoading(true);
      
      try {
        console.log(`Attempting to login with: ${email}`);
        await login(email, password);
        navigation.replace('Home');
      } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.code === 'ERR_NETWORK') {
          Alert.alert(
            "Network Error", 
            "Could not connect to the server. Please check your internet connection and make sure the server is running."
          );
        } else if (error.response) {
          if (error.response.status === 400) {
            Alert.alert(
              "Authentication Failed", 
              "Invalid credentials. Please check your email and password."
            );
          } else if (error.response.status === 401) {
            Alert.alert(
              "Authentication Failed", 
              "Unauthorized. Please check your credentials."
            );
          } else {
            Alert.alert(
              "Server Error", 
              `The server returned an error: ${error.response.status} ${error.response.statusText}`
            );
          }
        } else {
          Alert.alert(
            "Authentication Failed", 
            error.message || "An unexpected error occurred. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
    setFirstName("");
    setLastName("");
    setRetypePassword("");
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    clearForm();
  };

  const BackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={toggleAuthMode}>
      <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
        <Path 
          d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" 
          fill="black"
        />
      </Svg>
    </TouchableOpacity>
  );
  
  if (isRegistering) {
    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.fullScreenContainer}>
          <View style={styles.signupPage}>
            <BackButton />
            
            <Text style={styles.signupTitle}>Sign up</Text>
            
            <Text style={styles.fieldLabel}>First Name</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputSignup}
                placeholder="Enter your first name"
                placeholderTextColor="#a0a0a0"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            
            <Text style={styles.fieldLabel}>Last Name</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputSignup}
                placeholder="Enter your last name"
                placeholderTextColor="#a0a0a0"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputSignup}
                placeholder="Enter your email"
                placeholderTextColor="#a0a0a0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputSignup}
                placeholder="Enter your password"
                placeholderTextColor="#a0a0a0"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.passwordIconSignup} 
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Ionicons 
                  name={passwordVisible ? "eye-off" : "eye"} 
                  size={20} 
                  color="#676767" 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.fieldLabel}>Retype</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputSignup}
                placeholder="Retype your password"
                placeholderTextColor="#a0a0a0"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                value={retypePassword}
                onChangeText={setRetypePassword}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.signupButtonText}>Sign up</Text>
              )}
            </TouchableOpacity>
                   </View>
       </View>
     </TouchableWithoutFeedback>
   );
 }

const styles = StyleSheet.create({
  // Login page styles
  loginPage: {
    backgroundColor: '#fcfff8',
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',

  },
  hydroText: {
    color: '#27cfa0',

  },
  fastText: {
    color: '#0d6457',
    fontStyle: 'italic',

  },
  inputContainer: {
    width: '100%',
    maxWidth: 240,
    marginBottom: 14,
    position: 'relative',
  },
  input: {
    backgroundColor: '#eeeeee',
    borderRadius: 13,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 12,
    color: '#676767',
    height: 33,

  },
  passwordIcon: {
    position: 'absolute',
    right: 12,
    top: 6,
  },
  loginButton: {
    backgroundColor: '#27cfa0',
    borderRadius: 13,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 240,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',

  },
  arrowIcon: {
    marginLeft: 8,
  },
  forgotPassword: {
    marginBottom: 12,
  },
  forgotPasswordText: {
    fontSize: 10,

  },
  signupLink: {
    marginTop: 10,
  },
  signupText: {
    fontSize: 10,

  },
  grayText: {
    color: '#636763',
    fontFamily: 'Urban.ist',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000000',

  },
  
  // New signup page styles
  container: {
    flex: 1,
    backgroundColor: '#fcfff8',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fcfff8',
    width: '100%',
    height: '100%',
  },
  signupPage: {
    backgroundColor: '#fcfff8',
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    padding: 20,
    paddingHorizontal: 40,
    position: 'relative',
    maxWidth: 500,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 80,
    marginBottom: 12,
    marginLeft: 0,

  },
  fieldLabel: {
    fontSize: 12,
    color: '#707070',
    fontWeight: 'bold',
    marginLeft: 0,
    marginBottom: 2,

  },
  inputBox: {
    backgroundColor: '#eee',
    borderRadius: 13,
    height: 36,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'flex-start',
    marginLeft: 0,
    marginBottom: 10,
    position: 'relative',
  },
  inputSignup: {
    height: 36,
    paddingHorizontal: 15,
    fontSize: 12,
    color: '#676767',

  },
  passwordIconSignup: {
    position: 'absolute',
    right: 10,
    top: 8,
  },
  signupButton: {
    backgroundColor: '#27cfa0',
    borderRadius: 13,
    height: 40,
    width: '75%',
    alignSelf: 'center',
    marginLeft: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',

  },
});
  
  // Original login page design
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.loginPage}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            <Text style={styles.hydroText}>Hydro</Text>
            <Text style={styles.fastText}>Fast</Text>
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#676767"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#676767"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.passwordIcon} 
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons 
              name={passwordVisible ? "eye-off" : "eye"} 
              size={20} 
              color="#676767" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Login</Text>
              <Ionicons name="arrow-forward" size={18} color="white" style={styles.arrowIcon} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => Alert.alert("Reset Password", "Please contact your administrator to reset your password.")}
        >
          <Text style={styles.forgotPasswordText}>
            <Text style={styles.grayText}>Forgot Password?</Text>
            <Text style={styles.boldText}> Recover here</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signupLink}
          onPress={toggleAuthMode}
        >
          <Text style={styles.signupText}>
            <Text style={styles.grayText}>Don't have an account?</Text>
            <Text style={styles.boldText}> Sign up here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}