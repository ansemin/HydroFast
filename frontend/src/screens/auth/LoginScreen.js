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
import { login, isAuthenticated } from '../../services';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ className = "" }) {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    console.log('[LoginScreen] Checking if user is already authenticated...');
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        console.log('[LoginScreen] User already authenticated, navigating to Patients List');
        navigation.replace('Patients List');
      } else {
        console.log('[LoginScreen] User not authenticated, showing login form');
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!username) {
      console.log('[LoginScreen] Login attempt failed: Username field is empty');
      Alert.alert("Error", "Please enter your username");
      return;
    }
    
    if (!password) {
      console.log('[LoginScreen] Login attempt failed: Password field is empty');
      Alert.alert("Error", "Please enter your password");
      return;
    }

    console.log(`[LoginScreen] Starting login process for username: "${username}"`);
    setLoading(true);
    
    try {
      console.log(`[LoginScreen] Attempting authentication with server for user: ${username}`);
      await login(username, password);
      console.log(`[LoginScreen] Login successful for user: ${username}, navigating to Patients List`);
      navigation.replace('Patients List');
    } catch (error) {
      console.error(`[LoginScreen] Authentication failed for user: ${username}`, error);
      
      if (error.code === 'ERR_NETWORK') {
        Alert.alert(
          "Network Error", 
          "Could not connect to the server. Please check your internet connection and make sure the server is running."
        );
      } else if (error.response) {
        if (error.response.status === 400) {
          Alert.alert(
            "Authentication Failed", 
            "Invalid credentials. Please check your username and password."
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
  };

  const handleSignUpNavigation = () => {
    console.log('[LoginScreen] User navigating to Sign Up screen');
    navigation.navigate('Sign Up');
  };

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
            placeholder="Username"
            placeholderTextColor="#676767"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
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
          onPress={handleLogin}
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
          onPress={handleSignUpNavigation}
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
});