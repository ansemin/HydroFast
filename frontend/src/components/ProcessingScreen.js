import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const ProcessingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const step = route.params?.step; // Get step parameter

  useEffect(() => {
    let timeoutDurationSeconds = 5; // Default/fallback duration
    let nextScreen = null; 

    // Determine duration and next screen based on the step
    switch (step) {
      case 1: // From PhotoPreviewScreen
        timeoutDurationSeconds = 23;
        nextScreen = 'Wound Detection';
        break;
      case 2: // From WoundDetectionScreen
        timeoutDurationSeconds = 59;
        nextScreen = 'Depth Detection';
        break;
      case 3: // From DepthDetectionScreen
        timeoutDurationSeconds = 32;
        nextScreen = 'Mesh Detection';
        break;
      case 4: // From MeshDetectionScreen
        timeoutDurationSeconds = 10;
        nextScreen = 'Download Files';
        break;
      default:
        // If step is missing or invalid, maybe navigate back or to an error screen?
        // For now, just log an error and use default short timeout.
        console.error(`ProcessingScreen received invalid or missing step parameter: ${step}`);
        timeoutDurationSeconds = 3; // Short timeout for error case
        nextScreen = 'Patients List'; // Go back to list on error
        break;
    }

    const timeoutDurationMs = timeoutDurationSeconds * 1000;
    
    console.log(`Processing step ${step || 'unknown'}: ${timeoutDurationSeconds} seconds... Target: ${nextScreen || 'Error/Fallback'}`);

    const timer = setTimeout(() => {
      if (nextScreen) {
        console.log(`Timer finished for step ${step}. Navigating to ${nextScreen}...`);
        // Use replace to prevent user going back to the finished processing screen
        navigation.replace(nextScreen);
      } else {
         // This case should ideally not be reached with the switch logic
         console.error(`Timer finished for step ${step}, but nextScreen is null.`);
      }
    }, timeoutDurationMs);

    // Cleanup function
    return () => clearTimeout(timer);
    
  // Rerun effect if the step parameter changes (though it usually shouldn't mid-screen)
  }, [navigation, step]); 

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Processing...</Text>
        
        {/* Loading Indicator */}
        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color="#27CFA0" />
          <Text style={styles.subText}>Please kindly wait while processing</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8', // Background color
  },
  container: {
    flex: 1,
    alignItems: 'center', // Center content horizontally
    justifyContent: 'flex-start', // Align content to the top
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Adjust for Android status bar
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // Title color
    alignSelf: 'center',
    marginTop: 25, // Same as PhotoPreviewScreen title marginTop
    marginBottom: 10, // Same as PhotoPreviewScreen title marginBottom
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  indicatorContainer: {
    flex: 1, // Take remaining vertical space
    justifyContent: 'center', // Center vertically within this container
    alignItems: 'center', // Center horizontally
    width: '100%',
    paddingBottom: 50, // Add some padding at the bottom if needed
  },
  subText: {
    marginTop: 20,
    fontSize: 14,
    color: '#000000', // Text color
    textAlign: 'center',
    fontFamily: Platform.select({ // Consistent font
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default ProcessingScreen; 