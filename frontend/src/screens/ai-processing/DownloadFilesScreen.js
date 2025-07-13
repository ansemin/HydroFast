import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  StatusBar, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Path } from 'react-native-svg';

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

// Reference the ZIP file asset
// const zipAssetModule = require('../../Images/0138_z0.40_mesh.zip'); 

const DownloadFilesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};

  // Download functionality for depth maps
  const downloadDepthMap = async (url, filename) => {
    try {
      if (!url) {
        Alert.alert('Error', 'Depth map URL not available');
        return;
      }

      console.log(`Downloading depth map: ${filename}`);
      
      // For now, show download initiated message
      Alert.alert(
        'Download Started', 
        `Downloading ${filename}...\n\nNote: Full download functionality will be implemented in the next phase.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error downloading depth map:', error);
      Alert.alert('Download Error', `Failed to download ${filename}: ${error.message}`);
    }
  };

  // Download functionality for STL files
  const downloadSTLFile = async (url, filename) => {
    try {
      if (!url) {
        Alert.alert('Error', 'STL file URL not available');
        return;
      }

      console.log(`Downloading STL file: ${filename}`);
      
      // For now, show download initiated message
      Alert.alert(
        'Download Started', 
        `Downloading ${filename}...\n\nFile Size: ${scanData?.mesh_metadata?.file_size || 'Unknown'}\nFormat: STL (3D Model)`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error downloading STL file:', error);
      Alert.alert('Download Error', `Failed to download ${filename}: ${error.message}`);
    }
  };

  // Download all files
  const downloadAllFiles = async () => {
    try {
      const availableFiles = [];
      
      if (scanData?.processed_image) availableFiles.push('Segmented Image');
      if (scanData?.depth_map_8bit) availableFiles.push('Depth Map (8-bit)');
      if (scanData?.depth_map_16bit) availableFiles.push('Depth Map (16-bit)');
      if (scanData?.stl_file) availableFiles.push('STL File');
      
      if (availableFiles.length === 0) {
        Alert.alert('No Files', 'No files available for download');
        return;
      }
      
      Alert.alert(
        'Download All Files', 
        `Downloading ${availableFiles.length} files:\n• ${availableFiles.join('\n• ')}\n\nNote: Full download functionality will be implemented in the next phase.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error downloading all files:', error);
      Alert.alert('Download Error', `Failed to download files: ${error.message}`);
    }
  };

  /*
  const handleDownload = async () => {
    console.log('Download initiated using FileSystem.downloadAsync...');
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // 1. Get the Asset object primarily to find its network URI
      const asset = Asset.fromModule(zipAssetModule);
      const networkUri = asset.uri;
      console.log('Asset Network URI:', networkUri);

      if (!networkUri) {
        Alert.alert('Error', 'Could not resolve the asset network URI.');
        console.error('Failed to get network uri for asset:', asset);
        return;
      }
      
      // 2. Define temporary path and filename for the download destination
      const filename = "STL result.zip";
      const localDestinationUri = FileSystem.cacheDirectory + filename; 
      console.log('Local Download Destination:', localDestinationUri);

      // 3. Download the file from the Metro server URI to the local destination
      console.log(`Attempting download from ${networkUri} to ${localDestinationUri}`);
      const downloadResult = await FileSystem.downloadAsync(
        networkUri, 
        localDestinationUri
      );
      console.log('Download complete:', downloadResult);

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download file: Server responded with status ${downloadResult.status}`);
      }

      // 4. Share the explicitly downloaded file (using the URI from the download result)
      await Sharing.shareAsync(downloadResult.uri, { // Use downloadResult.uri
        mimeType: 'application/zip', 
        dialogTitle: 'Save or Share ZIP file', 
        UTI: 'public.zip-archive' 
      });
      console.log('Sharing dialog prompted for downloaded ZIP.');

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
            onPress={() => {
              // Navigate back to scan results if we have patientId, otherwise to patients list
              if (patientId) {
                navigation.navigate('Scan Results', { patientId });
              } else {
                navigation.navigate('Patients List');
              }
            }}
          >
            <BackArrowIcon />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Download Files</Text>
          
          {/* Placeholder for alignment */}
          <View style={{ width: 30 }} /> 
        </View>

        {/* Content Area */} 
        <View style={styles.contentContainer}>
          <Text style={styles.subTitle}>Your Files Are Ready</Text>

          {/* Segmented Image */}
          {scanData?.processed_image && (
            <View style={styles.fileBox}>
              <Image source={leftDownloadIcon} style={styles.fileIconLeft} />
              <View style={styles.fileInfoTextContainer}>
                <Text style={styles.fileName}>Segmented Image</Text>
                <Text style={styles.fileDetails}>PNG Image • Wound Detection Result</Text> 
              </View>
              <TouchableOpacity onPress={() => downloadDepthMap(scanData.processed_image, 'segmented_wound.png')}>
                <Image source={rightDownloadIcon} style={styles.fileIconRight} />
              </TouchableOpacity>
            </View>
          )}

          {/* 8-bit Depth Map */}
          {scanData?.depth_map_8bit && (
            <View style={styles.fileBox}>
              <Image source={leftDownloadIcon} style={styles.fileIconLeft} />
              <View style={styles.fileInfoTextContainer}>
                <Text style={styles.fileName}>Depth Map (8-bit)</Text>
                <Text style={styles.fileDetails}>PNG Image • ZoeDepth Visualization</Text> 
              </View>
              <TouchableOpacity onPress={() => downloadDepthMap(scanData.depth_map_8bit, 'depth_map_8bit.png')}>
                <Image source={rightDownloadIcon} style={styles.fileIconRight} />
              </TouchableOpacity>
            </View>
          )}

          {/* 16-bit Depth Map */}
          {scanData?.depth_map_16bit && (
            <View style={styles.fileBox}>
              <Image source={leftDownloadIcon} style={styles.fileIconLeft} />
              <View style={styles.fileInfoTextContainer}>
                <Text style={styles.fileName}>Depth Map (16-bit)</Text>
                <Text style={styles.fileDetails}>PNG Image • High Precision Depth Data</Text> 
              </View>
              <TouchableOpacity onPress={() => downloadDepthMap(scanData.depth_map_16bit, 'depth_map_16bit.png')}>
                <Image source={rightDownloadIcon} style={styles.fileIconRight} />
              </TouchableOpacity>
            </View>
          )}

          {/* STL File */}
          {scanData?.stl_file && (
            <View style={styles.fileBox}>
              <Image source={leftDownloadIcon} style={styles.fileIconLeft} />
              <View style={styles.fileInfoTextContainer}>
                <Text style={styles.fileName}>
                  {scanData.mesh_metadata?.filename || 'STL_Model.stl'}
                </Text>
                <Text style={styles.fileDetails}>
                  STL File • 3D Mesh • {scanData.mesh_metadata?.file_size || 'Unknown size'}
                </Text> 
              </View>
              <TouchableOpacity onPress={() => downloadSTLFile(scanData.stl_file, scanData.mesh_metadata?.filename || 'STL_Model.stl')}>
                <Image source={rightDownloadIcon} style={styles.fileIconRight} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer Button */} 
        <View style={styles.footer}>
          <TouchableOpacity style={styles.downloadAllButton} onPress={downloadAllFiles}>
            <Text style={styles.downloadAllButtonText}>Download All</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 20,
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000', 
    fontFamily: 'Urbanist',
    marginBottom: 20,
  },
  fileBox: {
    backgroundColor: '#EEEEEE', 
    borderRadius: 15, 
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10, // Add spacing between file boxes
  },
  fileIconLeft: {
    width: 45,
    height: 45,
    resizeMode: 'contain', 
    marginRight: 15,
  },
  fileInfoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000', 
  },
  fileDetails: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  fileIconRight: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  downloadAllButton: {
    backgroundColor: '#2864DA',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  downloadAllButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DownloadFilesScreen; 