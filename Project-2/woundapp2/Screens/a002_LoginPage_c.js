import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, Pressable, Keyboard, TouchableWithoutFeedback } from "react-native";
import { useNavigation } from '@react-navigation/native';

export default function LoginPage({ className = "" }) {
  const navigation = useNavigation();
  
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={[styles.loginPage, className && { /* custom class styles */ }]}>
        
        <View style={styles.hydroprintContainer}>
          <Text style={styles.hydroprintText}>
            <Text style={styles.hydroText}>Hydro</Text>
            <Text style={styles.printText}>print</Text>
          </Text>
        </View>

        <Pressable style={styles.inputPressable} onPress={() => null}>
          <View style={styles.emailContainer}>
            <Image source={require("./a002_assets/EmailIcon.png")} style={styles.emailIcon} />
            <TextInput
              style={styles.emailText}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
            />
          </View>
        </Pressable>

        
        <View style={styles.line} />

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>
            Forgot Password?{' '}       
            <Pressable onPress={() => navigation.navigate('Home')}>
              <Text style={styles.recoverText}>Recover here</Text>
            </Pressable> 
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={require("../assets/image.png")} style={styles.image} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={require("../assets/image-1.png")} style={styles.image} />
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            Don’t have an account?{' '}
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.signUpText}>Sign up here</Text>
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
  },
  emailIcon: {
    width: 20,
    height: 20,
    marginRight: -20,
  },
  lockIcon: {
    width: 20,
    height: 20,
    marginRight: -20,
  },
  emailText: {
    fontSize: 16,
    color: 'dimgray',
    flex: 1,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: 'royalblue',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginTop: 20,
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
