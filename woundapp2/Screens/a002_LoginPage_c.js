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
        
        <View style={styles.hydroprintContainer}>
          <Text style={styles.hydroprintText}>
            <Text style={styles.hydroText}>Hydro</Text>
            <Text style={styles.printText}>print</Text>
          </Text>
        </View>

        {isRegistering && (
          <>
            <Pressable style={styles.inputPressable} onPress={() => null}>
              <View style={styles.emailContainer}>
                <Image source={require("./a002_assets/EmailIcon.png")} style={styles.emailIcon} />
                <TextInput
                  style={styles.emailText}
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
          <View style={styles.emailContainer}>
            <Image source={require("./a002_assets/EmailIcon.png")} style={styles.emailIcon} />
            <TextInput
              style={styles.emailText}
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
          <View style={styles.passwordContainer}>
            <Image source={require("./a002_assets/PasswordIcon.png")} style={styles.lockIcon} />
            <TextInput
                style={styles.passwordText}
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

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginText}>{isRegistering ? "Register" : "Login"}</Text>
          )}
        </TouchableOpacity>

        {!isRegistering && (
          <View style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>
              Forgot Password?{' '}       
              <Pressable onPress={() => Alert.alert("Reset Password", "Please contact your administrator to reset your password.")}>
                <Text style={styles.recoverText}>Recover here</Text>
              </Pressable> 
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={() => Alert.alert("Social Login", "Social login is not available in this version.")}>
          <Image source={require("../assets/image.png")} style={styles.image} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => Alert.alert("Social Login", "Social login is not available in this version.")}>
          <Image source={require("../assets/image-1.png")} style={styles.image} />
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{' '}
            <TouchableOpacity onPress={toggleAuthMode}>
              <Text style={styles.signUpText}>{isRegistering ? "Login here" : "Sign up here"}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  hydroprintContainer: {
    marginBottom: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hydroprintText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  hydroText: {
    color: 'royalblue',
  },
  printText: {
    color: 'midnightblue',
    fontStyle: 'italic',
  },
  inputPressable: {
    paddingVertical: 10, // Expand clickable area
    width: '80%',
    alignItems: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
  },
  emailIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  lockIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  emailText: {
    fontSize: 16,
    color: 'dimgray',
    flex: 1,
    paddingLeft: 10,
  },
  line: {
    height: 2,
    backgroundColor: 'gray',
    width: '80%',
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  passwordText: {
    fontSize: 16,
    color: 'dimgray',
    flex: 1,
    paddingLeft: 10,
  },
  loginButton: {
    backgroundColor: 'royalblue',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginTop: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: 'dimgray',
    fontSize: 14,
  },
  recoverText: {
    color: 'royalblue',
    fontWeight: 'bold',
  },
  image: {
    width: 244,
    height: 41,
    borderRadius: 5,
    marginTop: 20,
  },
  signupContainer: {
    marginTop: 30,
  },
  signupText: {
    color: 'dimgray',
    fontSize: 14,
  },
  signUpText: {
    color: 'royalblue',
    fontWeight: 'bold',
  },
});
