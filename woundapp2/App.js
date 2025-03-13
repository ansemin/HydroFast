import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import HomePage from './Screens/a001_HomePage';
import ScansFullList from './Screens/a003_ScansFullList';
import {PatientsList} from './Screens/a004_PatientsList';
import NewPatientForm from './Screens/a005_NewPatientForm';
import PrintPreview from './Screens/a006_PrintPreview';
import PrinterList from './Screens/a007_PrintSettings';
import CameraPage from './Screens/a008e_CameraPage';

import TestPrinterList from './Screens/t007_PrintSettings';
//Tests
import IPhoneSe from './Screens/t004_PatientsList';


import LoginPage from './Screens/a002_LoginPage_c';



// const Drawer = createDrawerNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Drawer.Navigator initialRouteName='Home'>
//         <Drawer.Screen name='Home' component={HomePage} />
//         <Drawer.Screen name='Login' component={LoginPage}/>
//         <Drawer.Screen name='Scans Page' component={ScansFullList}/>
//         <Drawer.Screen name='Patients List' component={PatientsList}/>
//         <Drawer.Screen name='New Patient Form' component={NewPatientForm}/>
//         <Drawer.Screen name='Print Preview' component={PrintPreview}/>
//         <Drawer.Screen name='Printer Settings' component={PrinterList}/>
//         {/* <Drawer.Screen name='CameraPage' component={CameraPage}/> */}
//       </Drawer.Navigator>
//     </NavigationContainer>
//   );
// }

const Stack = createStackNavigator();

export default function App() {
  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Login'>
          <Stack.Screen 
            name="Login" 
            component={LoginPage} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Home" component={HomePage} />
          <Stack.Screen name="Scans Page" component={ScansFullList} />
          <Stack.Screen name="Patients List" component={PatientsList} />
          <Stack.Screen name="New Patient Form" component={NewPatientForm} />
          <Stack.Screen name="Print Preview" component={PrintPreview} />
          <Stack.Screen name="Printer Settings" component={PrinterList} />
          <Stack.Screen name="Test Patients List" component={IPhoneSe} />
          <Stack.Screen name="Test Printer List" component={TestPrinterList} />
          <Stack.Screen name="Camera Page" component={CameraPage}/>
        </Stack.Navigator>
      </NavigationContainer>
      
    // <React.StrictMode>
    //   <NavigationContainer>
    //     <Stack.Navigator initialRouteName='Login'>
    //       <Stack.Screen name="Home" component={HomePage} />
    //       <Stack.Screen name="Login" component={LoginPage} />
    //       <Stack.Screen name="Scans Page" component={ScansFullList} />
    //       <Stack.Screen name="Patients List" component={PatientsList} />
    //       <Stack.Screen name="New Patient Form" component={NewPatientForm} />
    //       <Stack.Screen name="Print Preview" component={PrintPreview} />
    //       <Stack.Screen name="Printer Settings" component={PrinterList} />
    //       <Stack.Screen name="Test Patients List" component={IPhoneSe} />
    //       <Stack.Screen name="Test Printer List" component={TestPrinterList} />
    //       <Stack.Screen name="Camera Page" component={CameraPage}/>

    //     </Stack.Navigator>
    //   </NavigationContainer>
    // </React.StrictMode>

  );
}
