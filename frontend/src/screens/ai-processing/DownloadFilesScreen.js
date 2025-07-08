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
import { useNavigation } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// --- Asset Imports ---
const backArrowIcon = require('../../assets/icons/backButton.png');
const leftDownloadIcon = require('../../assets/images/download_icon_green_left.png');
const rightDownloadIcon = require('../../assets/images/download_icon_white_right.png');

// Reference the ZIP file asset
// const zipAssetModule = require('../../Images/0138_z0.40_mesh.zip'); 

const DownloadFilesScreen = () => {
  const navigation = useNavigation();

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
            onPress={() => navigation.navigate('Patients List')}
          >
            <Image source={backArrowIcon} style={styles.backArrowImage} /> 
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Download Files</Text>
          
          {/* Placeholder for alignment */}
          <View style={{ width: 30 }} /> 
        </View>

        {/* Content Area */} 
        <View style={styles.contentContainer}>
          <Text style={styles.subTitle}>Your Files Are Ready</Text>

          {/* File Info Box */} 
          <View style={styles.fileBox}>
            <Image source={leftDownloadIcon} style={styles.fileIconLeft} />
            <View style={styles.fileInfoTextContainer}>
              <Text style={styles.fileName}>STL result.zip</Text>
              <Text style={styles.fileDetails}>ZIP Archive 14.2 MB</Text> 
            </View>
            <TouchableOpacity onPress={() => Alert.alert("Download Disabled", "This feature is temporarily disabled.")}>
              <Image source={rightDownloadIcon} style={styles.fileIconRight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Button */} 
        <View style={styles.footer}>
          <TouchableOpacity style={styles.downloadAllButton} onPress={() => Alert.alert("Download Disabled", "This feature is temporarily disabled.")}>
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
  backArrowImage: {
    width: 18, 
    height: 16, 
    resizeMode: 'contain',
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