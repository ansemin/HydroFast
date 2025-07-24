import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import all the screens
import { LoginScreen, SignUpScreen } from './src/screens/auth';
import { PatientsListScreen, NewPatientFormScreen, PatientDetailScreen, ScanResultsScreen } from './src/screens/patients';
import { CameraScreen, PhotoPreviewScreen } from './src/screens/scanning';
import { ProcessingScreen, WoundDetectionScreen, DepthDetectionScreen, MeshDetectionScreen, DownloadFilesScreen, CroppedOriginalScreen } from './src/screens/ai-processing';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Login'>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Sign Up" component={SignUpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Patients List" component={PatientsListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="New Patient Form" component={NewPatientFormScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Camera Page" component={CameraScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Patient Detail" component={PatientDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Photo Preview" component={PhotoPreviewScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Scan Results" component={ScanResultsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Processing" component={ProcessingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CroppedOriginal" component={CroppedOriginalScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WoundDetection" component={WoundDetectionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DepthDetection" component={DepthDetectionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MeshDetection" component={MeshDetectionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DownloadFiles" component={DownloadFilesScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}