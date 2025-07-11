import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  Alert
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Back Arrow SVG Component
function BackArrowIcon() {
  return (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
    </Svg>
  );
}

// --- Asset Imports ---
const leftDownloadIcon = require('../../assets/images/download_icon_green_left.png');
const rightDownloadIcon = require('../../assets/images/download_icon_white_right.png');

// Reference the same ZIP file asset for download demo
// const zipAssetModule = require('../../Images/0138_z0.40_mesh.zip');

// Placeholder data for scans
const scansData = [
  {
    id: '001',
    scanTitle: 'Scan #001',
    date: '11 Apr 2025',
    fileName: 'STL result.zip',
    fileType: 'ZIP Archive',
    fileSize: '14.2 MB',
  },
  {
    id: '002',
    scanTitle: 'Scan #002',
    date: '11 Apr 2025',
    fileName: 'STL result.zip',
    fileType: 'ZIP Archive',
    fileSize: '14.2 MB',
  },
];

const ScanResultsScreen = ({ route, navigation }) => {
  // Safely access patientId from route params
  const patientId = route.params?.patientId; 

  useEffect(() => {
    if (!patientId) {
      console.warn('ScanResultsScreen loaded without a patientId parameter.');
    }
  }, [patientId]);

  // Download handler copied from DownloadFilesScreen
  /*
  const handleDownload = async (scanItem) => {
    const downloadFilename = `${scanItem.fileName}.zip`;
    console.log(`Download initiated for ${downloadFilename}...`);
    
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      const asset = Asset.fromModule(zipAssetModule);
      const networkUri = asset.uri;

      if (!networkUri) {
        Alert.alert('Error', 'Could not resolve the asset network URI.');
        return;
      }

      const localDestinationUri = FileSystem.cacheDirectory + downloadFilename;
      console.log(`Attempting download from ${networkUri} to ${localDestinationUri}`);
      
      const downloadResult = await FileSystem.downloadAsync(
        networkUri,
        localDestinationUri
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download file: Server responded with status ${downloadResult.status}`);
      }

      console.log('Download complete:', downloadResult);

      await Sharing.shareAsync(downloadResult.uri, { 
        mimeType: 'application/zip',
        dialogTitle: `Save or Share ${downloadFilename}`,
        UTI: 'public.zip-archive'
      });
      console.log(`Sharing dialog prompted for ${downloadFilename}.`);

    } catch (error) {
      console.error('Error during FileSystem.downloadAsync/share process:', error);
      Alert.alert('Download Error', `Failed to download or share the file: ${error.message}`);
    }
  };
  */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */} 
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackArrowIcon />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan Results</Text>
          
          {/* Placeholder for alignment */}
          <View style={{ width: 30 }} /> 
        </View>

        {/* Content Area */} 
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.subTitle}>Previous Scans</Text>

          {/* Map through placeholder scan data */} 
          {scansData.map((scan) => (
            <View key={scan.id} style={styles.scanCard}>
              {/* Scan Card Header */}
              <View style={styles.scanCardHeader}>
                <Text style={styles.scanCardTitle}>{scan.scanTitle}</Text>
                <Text style={styles.scanCardDate}>{scan.date}</Text>
              </View>
              
              {/* Inner File Info Box */}
              <View style={styles.fileBox}>
                <Image source={leftDownloadIcon} style={styles.fileIconLeft} />
                <View style={styles.fileInfoTextContainer}>
                  <Text style={styles.fileName}>{scan.fileName}</Text>
                  <Text style={styles.fileDetails}>{scan.fileType} {scan.fileSize}</Text> 
                </View>
                <TouchableOpacity 
                  style={styles.downloadButtonRight}
                  onPress={() => Alert.alert("Download Disabled", "This feature is temporarily disabled.")}
                >
                  <Image source={rightDownloadIcon} style={styles.fileIconRight} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFFF8', 
  },
  container: {
    flex: 1,
    backgroundColor: '#FCFFF8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 5, 
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000', 
    fontFamily: 'Urbanist', 
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10, 
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  scanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scanCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  scanCardDate: {
    fontSize: 14,
    color: '#666666',
  },
  fileBox: {
    backgroundColor: '#EEEEEE', 
    borderRadius: 10, 
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileIconLeft: {
    width: 35,
    height: 35,
    resizeMode: 'contain', 
    marginRight: 15,
  },
  fileInfoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000', 
  },
  fileDetails: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  downloadButtonRight: {
    padding: 5,
  },
  fileIconRight: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
});

export default ScanResultsScreen; 