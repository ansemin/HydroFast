import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Linking, 
  Alert, 
  Platform, 
  StatusBar, 
  SafeAreaView 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Rect } from 'react-native-svg';
import { BackArrowIcon } from '../../components/ui';
import { API_BASE_URL } from '@env';

// Green File Icon SVG Component
function FileIcon() {
  return (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Rect width="40" height="40" rx="6" fill="#27CF9F"/>
      <Path d="M20.0005 18.019L19.9997 24.5M19.9997 24.5C20.3733 24.505 20.7418 24.2482 21.0137 23.9348L22.8346 21.8927M19.9997 24.5C19.6394 24.4952 19.2743 24.2398 18.9858 23.9348L17.1543 21.8927" stroke="white" strokeWidth="1.71836" strokeLinecap="round"/>
      <Path d="M23.4325 10.5726L23.4325 13.7229C23.4325 14.803 23.4325 15.343 23.768 15.6785C24.1035 16.0141 24.6436 16.0141 25.7236 16.0141L28.0612 16.0141" stroke="white" strokeWidth="1.71836"/>
      <Path d="M14.291 10.8594H23.9482C24.4269 10.8595 24.8741 11.0988 25.1396 11.4971L27.5107 15.0547C27.6675 15.2899 27.7519 15.566 27.752 15.8486V27.209C27.7519 27.9998 27.1101 28.6406 26.3193 28.6406H14.291C13.5003 28.6406 12.8594 27.9997 12.8594 27.209V12.291C12.8594 11.5003 13.5003 10.8594 14.291 10.8594Z" stroke="white" strokeWidth="1.71836"/>
    </Svg>
  );
}

// Download Button Icon SVG Component (using download_button_white.svg)
function DownloadButtonIcon() {
  return (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Rect width="40" height="40" rx="20" fill="#FCFFF8"/>
      <Path d="M20.0002 22.069V12.4138M20.0002 22.069C18.8412 22.069 16.6759 18.8036 15.8623 17.9756M20.0002 22.069C21.1592 22.069 23.3246 18.8036 24.1382 17.9756" stroke="#707070" strokeWidth="1.58621" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M28.6441 23.7241C28.6441 26.3488 28.0964 26.8965 25.4717 26.8965H14.897C12.2724 26.8965 11.7246 26.3488 11.7246 23.7241" stroke="#707070" strokeWidth="1.58621" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const DownloadFilesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { scanId, scanData, patientId } = route.params || {};

  // Download a file by opening it in the browser
  const downloadFile = async (url, filename) => {
    try {
      if (!url) {
        Alert.alert('Error', 'File URL not available');
        return;
      }

      // Ensure URL is absolute using the same logic as the API service
      let downloadUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Use the same base URL configuration as the API service
        const baseUrl = API_BASE_URL ? `http://${API_BASE_URL}:8000` : 'http://127.0.0.1:8000';
        downloadUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      }

      console.log(`Downloading ${filename} from:`, downloadUrl);
      
      // Open the URL in the browser/default app
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
        Alert.alert('Download Started', `${filename} download has been initiated`);
      } else {
        Alert.alert('Error', `Cannot open URL: ${downloadUrl}`);
      }
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
      Alert.alert('Download Error', `Failed to download ${filename}: ${error.message}`);
    }
  };

  // Get the STL files for download (STL file + STL preview ONLY)
  const getSTLFiles = () => {
    const files = [];
    
    // Check if we have scanData with real file info
    if (!scanData) {
      // No scan data - return empty array
      return [];
    }

    // Get patient name from the scan data or URL
    let patientName = 'Patient';
    if (scanData.stl_file) {
      // Extract patient name from file path: /media/Allison_Torres/Allison_Torres_scan002_wound_model.stl
      const pathParts = scanData.stl_file.split('/');
      const fileName = pathParts[pathParts.length - 1]; // Get the filename
      const match = fileName.match(/^(.+?)_scan\d+/); // Extract patient name before "_scan"
      if (match) {
        patientName = match[1].replace(/_/g, ' '); // Replace underscores with spaces
      }
    }

    // Add STL file if available
    if (scanData.stl_file) {
      const fileSize = scanData.stl_generation?.stl_file_size_mb ? `${scanData.stl_generation.stl_file_size_mb}MB` : 'Unknown';
      files.push({
        name: `${patientName} STL`,
        filename: scanData.stl_file.split('/').pop() || 'wound_model.stl',
        url: scanData.stl_file,
        type: '3D Model',
        size: fileSize,
        isMainFile: true
      });
    }

    // Add STL preview if available
    if (scanData.preview_image) {
      const fileSize = scanData.preview_generation?.preview_file_size_mb ? `${scanData.preview_generation.preview_file_size_mb}MB` : 'Unknown';
      files.push({
        name: `${patientName} STL Preview`,
        filename: scanData.preview_image.split('/').pop() || 'preview.png',
        url: scanData.preview_image,
        type: 'Image',
        size: fileSize,
        isMainFile: false
      });
    }

    return files;
  };

  const downloadAllFiles = async () => {
    try {
      const files = getSTLFiles();
      if (files.length === 0) {
        Alert.alert('No Files', 'No files are available for download');
        return;
      }

      // In a real implementation, you would zip the files server-side and download the ZIP
      // For now, we'll download each file individually with a delay
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await downloadFile(file.url, file.filename);
        
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      Alert.alert('Download All', `Started downloading ${files.length} files`);
    } catch (error) {
      console.error('Error downloading all files:', error);
      Alert.alert('Download Error', `Failed to download files: ${error.message}`);
    }
  };

  const stlFiles = getSTLFiles();


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Scan Results', { patientId })}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Download Files</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Your Files Are Ready</Text>

        {/* STL Files */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stlFiles.length > 0 ? (
            <View style={styles.fileContainer}>
              {stlFiles.map((file, index) => {
                const currentDate = new Date();
                const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
                
                return (
                  <View key={index} style={styles.scanCard}>
                    {/* Scan Card Header */}
                    <View style={styles.scanCardHeader}>
                      <Text style={styles.scanCardTitle}>
                        {file.isMainFile ? 'STL File' : 'STL Preview'}
                      </Text>
                      <Text style={styles.scanCardDate}>{formattedDate}</Text>
                    </View>
                    
                    {/* Inner File Info Box */}
                    <View style={styles.fileBox}>
                      <FileIcon />
                      <View style={styles.fileInfoTextContainer}>
                        <Text style={styles.fileName}>{file.name}</Text>
                        <Text style={styles.fileDetails}>{file.type} {file.size}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.downloadButtonRight}
                        onPress={() => downloadFile(file.url, file.filename)}
                      >
                        <DownloadButtonIcon />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noFileContainer}>
              <Text style={styles.noFileText}>No STL files available for download</Text>
              <Text style={styles.noFileSubtext}>
                Please ensure all processing steps have been completed.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Download All Button */}
        {stlFiles.length > 0 && (
          <TouchableOpacity style={styles.downloadButton} onPress={downloadAllFiles}>
            <Text style={styles.downloadButtonText}>Download All</Text>
          </TouchableOpacity>
        )}
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
    padding: 10,
    borderRadius: 30,
  },
  scrollContent: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 18,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 44,
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 40, // Reduced margin to move download boxes up
    marginLeft: 15, // Add left margin to move text to the left
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  fileContainer: {
    marginBottom: 20, // Reduced margin
    marginHorizontal: 15,
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
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  scanCardDate: {
    fontSize: 14,
    color: '#666666',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
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
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  fileDetails: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  downloadButtonRight: {
    padding: 5,
  },
  fileItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(238, 238, 238, 0.93)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 13,
    alignItems: 'center',
    height: 56,
    marginBottom: 10, // Add spacing between multiple files
  },
  fileInfo: {
    flex: 1,
    marginLeft: 13,
  },
  fileType: {
    fontSize: 10.95,
    fontWeight: '400',
    color: '#707070',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  fileSize: {
    fontSize: 10.95,
    fontWeight: '400',
    color: '#707070',
    position: 'absolute',
    right: -140, // Position it to the right
    top: 20,
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  downloadButtonContainer: {
    marginLeft: 'auto',
  },
  noFileContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  noFileText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  noFileSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  downloadButton: {
    backgroundColor: '#27CFA0',
    borderRadius: 13,
    width: '90%', // Make it wider like in the image
    paddingVertical: 15,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20, // Reduced bottom margin to move button up
    marginTop: 10, // Added top margin to move button down from content
    shadowColor: '#70E7BB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default DownloadFilesScreen; 