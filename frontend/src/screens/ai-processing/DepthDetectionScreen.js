import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

// Back Arrow SVG Component
function BackArrowIcon() {
  return (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
    </Svg>
  );
}

// Fallback image for depth detection
const fallbackDepthImage = require('../../assets/images/0138_depth_grayscale_zd.png');

const DepthDetectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};
  
  const handleProcess = () => {
    // Navigate to Processing screen, specifying step 3
    navigation.navigate('Processing', { 
      step: 3, 
      scanId, 
      scanData, 
      patientId 
    }); 
  };

  // Get depth image source
  const getDepthImageSource = () => {
    if (scanData?.depth_map_8bit) {
      return { uri: scanData.depth_map_8bit };
    } else {
      return fallbackDepthImage;
    }
  };

  // Format depth statistics for display
  const formatDepthStats = (stats) => {
    if (!stats) return null;
    
    return {
      maxDepth: stats.max_depth ? stats.max_depth.toFixed(3) : 'N/A',
      meanDepth: stats.mean_depth ? stats.mean_depth.toFixed(3) : 'N/A',
      validPixels: stats.valid_pixel_count || 0
    };
  };

  const depthMetadata = scanData?.depth_metadata;
  const depthStats = formatDepthStats(depthMetadata?.depth_statistics);
  const volumeEstimate = depthMetadata?.volume_estimate?.total_volume || 0;
  const woundSeverity = depthMetadata?.wound_severity || 'unknown';
  const processingConfidence = depthMetadata?.processing_confidence || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Depth Detection</Text>
        
        {/* Image Preview */}
        <View style={styles.imageOuterContainer}>
          <View style={styles.imageContainer}>
            <Image source={getDepthImageSource()} style={styles.image} />
          </View>
        </View>
        
        {/* Depth Metadata */}
        {depthMetadata && (
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataTitle}>ZoeDepth Analysis Results</Text>
            
            {/* Wound Severity */}
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Wound Severity:</Text>
              <Text style={[styles.metadataValue, getSeverityStyle(woundSeverity)]}>{woundSeverity.toUpperCase()}</Text>
            </View>
            
            {/* Volume Estimate */}
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Volume Estimate:</Text>
              <Text style={styles.metadataValue}>{volumeEstimate.toFixed(1)} mm³</Text>
            </View>
            
            {/* Processing Confidence */}
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Confidence:</Text>
              <Text style={styles.metadataValue}>{(processingConfidence * 100).toFixed(1)}%</Text>
            </View>
            
            {/* Surface Area */}
            {depthMetadata.surface_area && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Surface Area:</Text>
                <Text style={styles.metadataValue}>{depthMetadata.surface_area.toFixed(1)} mm²</Text>
              </View>
            )}
            
            {/* Depth Statistics */}
            {depthStats && (
              <>
                <Text style={styles.subMetadataTitle}>Depth Statistics</Text>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Max Depth:</Text>
                  <Text style={styles.metadataValue}>{depthStats.maxDepth}</Text>
                </View>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Mean Depth:</Text>
                  <Text style={styles.metadataValue}>{depthStats.meanDepth}</Text>
                </View>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Valid Pixels:</Text>
                  <Text style={styles.metadataValue}>{depthStats.validPixels.toLocaleString()}</Text>
                </View>
              </>
            )}
          </View>
        )}
        
        {/* Action Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.processButton} onPress={handleProcess}>
            <Text style={styles.buttonText}>Process</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Helper function for severity styling
  function getSeverityStyle(severity) {
    switch (severity) {
      case 'superficial':
        return { color: '#27CFA0' }; // Green
      case 'moderate':
        return { color: '#FFA500' }; // Orange
      case 'deep':
        return { color: '#FF6B6B' }; // Red
      default:
        return { color: '#666666' }; // Gray
    }
  }
};

// Styles adapted from WoundDetectionScreen/PhotoPreviewScreen with metadata styling
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8',
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 18,
    padding: 10,
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
  },
  scrollContent: {
    padding: 10,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    alignSelf: 'center',
    marginTop: 25, 
    marginBottom: 10, 
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  imageOuterContainer: {
    width: '100%',
    height: 350, // Reduced to make room for metadata
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '90%',
    height: 320,
    borderRadius: 13,
    overflow: 'hidden', 
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', 
  },
  metadataContainer: {
    width: '90%',
    backgroundColor: '#F5F5F5',
    borderRadius: 13,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  subMetadataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 10,
    marginBottom: 5,
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 20, 
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    width: '40%',
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(112, 231, 187, 0.55)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default DepthDetectionScreen; 