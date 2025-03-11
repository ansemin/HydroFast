import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, Pressable } from "react-native";
import { useNavigation } from '@react-navigation/native';

export default function LoginPage({ className = "" }) {
  const navigation = useNavigation();
  return (
    <View style={[styles.loginPage, className && { /* custom class styles */ }]}>
      <View style={styles.hydroprintContainer}>
        <Text style={styles.hydroprintText}>
          <Text style={styles.hydroText}>Hydro</Text>
          <Text style={styles.printText}>print</Text>
        </Text>
      </View>

      <View style={styles.emailContainer}>
        <Image source={require("../assets/Vector.svg")} style={styles.vectorIcon} />
        {/* <Text style={styles.emailText}>Email</Text> */}
        <TextInput
          style={styles.emailText}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.line} />

      <View style={styles.passwordContainer}>
        <Image source={require("../assets/Vector1.svg")} style={styles.vectorIcon} />
        {/* <Text style={styles.passwordText}>Password</Text> */}
        <TextInput
          style={styles.passwordText}
          placeholder="Password"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
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
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vectorIcon: {
    width: 20,
    height: 20,
    marginRight: -20,
  },
  emailText: {
    fontSize: 16,
    color: 'dimgray',
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
    marginBottom: 10,
  },
  passwordText: {
    fontSize: 16,
    color: 'dimgray',
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








// import Vector from "./assets/Vector";
// import Line from "./assets/Line";
// import Vector1 from "./assets/Vector1";
// import "./a002_LoginPage.css";

// export default function LoginPage({ className = "" }) {
//   return (
//     <div className={`${className} login-page-login-page`}>
//       <div className="login-page-tt-hydroprint">
//         <div className="login-page-hydroprint">
//           <span>
//             <span className="login-page-text">Hydro</span>
//             <span className="login-page-text-1">print</span>
//           </span>
//         </div>
//       </div>
//       <div className="login-page-ttt-vector-email">
//         <div className="login-page-tt-vector-email">
//           <div className="login-page-t-vector">
//             <Vector className="login-page-vector" />
//           </div>
//           <div className="login-page-email">Email</div>
//         </div>
//       </div>
//       <div className="login-page-t-line">
//         <Line className="login-page-line" />
//       </div>
//       <div className="login-page-tt-vector-password">
//         <div className="login-page-t-vector-password">
//           <Vector1 className="login-page-vector-1" />
//           <div className="login-page-password">Password</div>
//         </div>
//       </div>
//       <Line className="login-page-line-1" />
//       <div className="login-page-tt-rectangle">
//         <div className="login-page-t-rectangle">
//           <div className="login-page-login">Login</div>
//         </div>
//       </div>
//       <div className="login-page-tt-forgot-password-recover-here">
//         <div className="login-page-t-forgot-password-recover-here">
//           <div>
//             <span className="login-page-para-1">
//               {"Forgot Password? "}
//               <span className="login-page-text-2">Recover here</span>
//             </span>
//           </div>
//         </div>
//       </div>
//       <div className="login-page-tt-image">
//         <div className="login-page-t-image">
//           <div className="login-page-image" />
//         </div>
//       </div>
//       <div className="login-page-tt-image-1">
//         <div className="login-page-t-image-1">
//           <div className="login-page-image-1" />
//         </div>
//       </div>
//       <div className="login-page-t-don-thave-an-account-sign-up-here">
//         <div className="login-page-don-thave-an-account-sign-up-here">
//           <span>
//             {"Don’t have an account? "}
//             <span className="login-page-text-3">Sign up here</span>
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }
