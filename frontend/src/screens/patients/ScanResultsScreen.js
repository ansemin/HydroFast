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
  Alert
} from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { BackArrowIcon } from '../../components/ui';

// Green Download Icon SVG Component (left icon)
function LeftDownloadIcon() {
  return (
    <Svg width="35" height="35" viewBox="0 0 40 40" fill="none">
      <Rect width="40" height="40" rx="6" fill="#27CF9F"/>
      <Path d="M20.0005 18.019L19.9997 24.5M19.9997 24.5C20.3733 24.505 20.7418 24.2482 21.0137 23.9348L22.8346 21.8927M19.9997 24.5C19.6394 24.4952 19.2743 24.2398 18.9858 23.9348L17.1543 21.8927" stroke="white" strokeWidth="1.71836" strokeLinecap="round"/>
      <Path d="M23.4325 10.5726L23.4325 13.7229C23.4325 14.803 23.4325 15.343 23.768 15.6785C24.1035 16.0141 24.6436 16.0141 25.7236 16.0141L28.0612 16.0141" stroke="white" strokeWidth="1.71836"/>
      <Path d="M14.291 10.8594H23.9482C24.4269 10.8595 24.8741 11.0988 25.1396 11.4971L27.5107 15.0547C27.6675 15.2899 27.7519 15.566 27.752 15.8486V27.209C27.7519 27.9998 27.1101 28.6406 26.3193 28.6406H14.291C13.5003 28.6406 12.8594 27.9997 12.8594 27.209V12.291C12.8594 11.5003 13.5003 10.8594 14.291 10.8594Z" stroke="white" strokeWidth="1.71836"/>
    </Svg>
  );
}

// White Download Icon SVG Component (right icon)
function RightDownloadIcon() {
  return (
    <Svg width="35" height="35" viewBox="0 0 40 40" fill="none">
      <Rect width="40" height="40" rx="20" fill="#FCFFF8"/>
      <Path d="M20.0002 22.069V12.4138M20.0002 22.069C18.8412 22.069 16.6759 18.8036 15.8623 17.9756M20.0002 22.069C21.1592 22.069 23.3246 18.8036 24.1382 17.9756" stroke="#707070" strokeWidth="1.58621" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M28.6441 23.7241C28.6441 26.3488 28.0964 26.8965 25.4717 26.8965H14.897C12.2724 26.8965 11.7246 26.3488 11.7246 23.7241" stroke="#707070" strokeWidth="1.58621" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

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
            onPress={() => navigation.navigate('Patient Detail', { patientId })}
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
                <LeftDownloadIcon />
                <View style={styles.fileInfoTextContainer}>
                  <Text style={styles.fileName}>{scan.fileName}</Text>
                  <Text style={styles.fileDetails}>{scan.fileType} {scan.fileSize}</Text> 
                </View>
                <TouchableOpacity 
                  style={styles.downloadButtonRight}
                  onPress={() => Alert.alert("Download Disabled", "This feature is temporarily disabled.")}
                >
                  <RightDownloadIcon />
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
  fileInfoTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 15,
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
});

export default ScanResultsScreen; 