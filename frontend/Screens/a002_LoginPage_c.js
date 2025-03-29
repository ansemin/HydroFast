import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, Pressable, Keyboard, TouchableWithoutFeedback, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { login, register, isAuthenticated } from '../api';

export default function LoginPage({ className = "" }) {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");

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
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    if (isRegistering && !username) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    setLoading(true);
    
    try {
      if (isRegistering) {
        await register(username, email, password);
        Alert.alert("Success", "Registration successful!");
      } else {
        console.log(`Attempting to login with: ${email}`);
        await login(email, password);
      }
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
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setEmail("");
    setPassword("");
    setUsername("");
  };
  
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={[styles.loginPage, className && { /* custom class styles */ }]}>
        
        <View style={styles.hydrofastContainer}>
          {/* NUS Logo */}
          <Image 
            source={require('./assets/NUS_logo.jpg')} 
            style={styles.nusLogo}
            resizeMode="contain"
          />
          <Text style={styles.hydrofastText}>
            <Text style={styles.hydroText}>Hydro</Text>
            <Text style={styles.fastText}>fast</Text>
          </Text>
        </View>

        <Text style={styles.signInText}>Sign in to your account</Text>

        {isRegistering && (
          <>
            <Pressable style={styles.inputPressable} onPress={() => null}>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </Pressable>
            <View style={styles.line} />
          </>
        )}

        <Pressable style={styles.inputPressable} onPress={() => null}>
          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </Pressable>
        
        <View style={styles.line} />

        <Pressable style={styles.inputPressable} onPress={() => null}>
          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </Pressable>

        <View style={styles.line} />

        <View style={styles.forgotContainer}>
          <Pressable onPress={() => Alert.alert("Reset Password", "Please contact your administrator to reset your password.")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.loginButtonContent}>
              <Text style={styles.loginText}>{isRegistering ? "Register" : "Login"}</Text>
              <Text style={styles.arrowText}>→</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{' '}
            <TouchableOpacity onPress={toggleAuthMode}>
              <Text style={styles.signUpLink}>{isRegistering ? "Login here" : "Sign up here"}</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  loginPage: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  hydrofastContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nusLogo: {
    width: 150,
    height: 100,
    marginBottom: 10,
  },
  hydrofastText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  hydroText: {
    color: '#1fd655', // Primary green
  },
  fastText: {
    color: '#0c9d37', // Darker green for contrast
  },
  signInText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputPressable: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 5,
  },
  inputField: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    height: 24,
    padding: 0,
  },
  line: {
    height: 1,
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 360,
    marginBottom: 10,
  },
  forgotContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#1fd655',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1fd655',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    maxWidth: 360,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  arrowText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  signupContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signUpLink: {
    color: '#1fd655',
    fontWeight: 'bold',
  },
});
