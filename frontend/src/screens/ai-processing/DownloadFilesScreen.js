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
import Svg, { Path } from 'react-native-svg';

// Back Arrow SVG Component
function BackArrowIcon() {
  return (
    <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <Path d="M16 9.01626C16.5613 9.01626 17.0163 8.56126 17.0163 8C17.0163 7.43874 16.5613 6.98374 16 6.98374L16 9.01626ZM1.2814 7.2814C0.884525 7.67827 0.884525 8.32173 1.2814 8.7186L7.74882 15.186C8.14569 15.5829 8.78915 15.5829 9.18602 15.186C9.58289 14.7891 9.58289 14.1457 9.18602 13.7488L3.4372 8L9.18602 2.25118C9.58289 1.85431 9.58289 1.21085 9.18602 0.813981C8.78915 0.417108 8.14569 0.417108 7.74881 0.813981L1.2814 7.2814ZM16 6.98374L2 6.98375L2 9.01626L16 9.01626L16 6.98374Z" fill="black"/>
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

      // Check if this is a simulation URL
      if (url.startsWith('simulation://')) {
        Alert.alert(
          'Simulation Mode', 
          `This is a demo. In the real app, ${filename} would be downloaded from the server.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      console.log(`Downloading ${filename} from:`, url);
      
      // Open the URL in the browser/default app
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        Alert.alert('Download Started', `${filename} download has been initiated`);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
      Alert.alert('Download Error', `Failed to download ${filename}: ${error.message}`);
    }
  };

  // Download all available files
  const downloadAllFiles = async () => {
    try {
      const files = getAvailableFiles();
      if (files.length === 0) {
        Alert.alert('No Files', 'No files are available for download');
        return;
      }

      // Check if we're in simulation mode
      const isSimulation = files.some(file => file.url.startsWith('simulation://'));
      
      if (isSimulation) {
        Alert.alert(
          'Simulation Mode',
          `This is a demo. In the real app, all ${files.length} files would be downloaded as a ZIP archive.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Download each file with a small delay between them
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await downloadFile(file.url, file.name);
        
        // Add a small delay between downloads
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

  // Get list of available files for download
  const getAvailableFiles = () => {
    const files = [];

    // Check if we have scanData, otherwise use simulation data
    const isSimulation = !scanData?.image;
    
    if (isSimulation) {
      // Simulation mode - return mock file list for testing
      return [
        {
          name: 'Original Image',
          filename: 'original_image.jpg',
          url: 'simulation://original_image.jpg',
          type: 'Image',
          description: 'Original wound photograph'
        },
        {
          name: 'Segmented Image',
          filename: 'segmented_wound.jpg',
          url: 'simulation://segmented_wound.jpg',
          type: 'Image',
          description: 'Wound segmentation result'
        },
        {
          name: '8-bit Depth Map',
          filename: 'depth_map_8bit.png',
          url: 'simulation://depth_map_8bit.png',
          type: 'Image',
          description: 'ZoeDepth analysis result (8-bit)'
        },
        {
          name: '16-bit Depth Map',
          filename: 'depth_map_16bit.png',
          url: 'simulation://depth_map_16bit.png',
          type: 'Image',
          description: 'ZoeDepth analysis result (16-bit)'
        },
        {
          name: 'STL 3D Model',
          filename: 'wound_model.stl',
          url: 'simulation://wound_model.stl',
          type: '3D Model',
          description: '3D printable mesh (2.4 MB)'
        },
        {
          name: 'STL Preview',
          filename: 'stl_preview.png',
          url: 'simulation://stl_preview.png',
          type: 'Image',
          description: '3D mesh visualization'
        },
        {
          name: 'G-code Print File',
          filename: 'wound_model.gcode',
          url: 'simulation://wound_model.gcode',
          type: 'Print File',
          description: 'Ready for 3D printing'
        }
      ];
    }

    // Original image
    if (scanData?.image) {
      files.push({
        name: 'Original Image',
        filename: 'original_image.jpg',
        url: scanData.image,
        type: 'Image',
        description: 'Original wound photograph'
      });
    }

    // Segmented image (wound detection result)
    if (scanData?.processed_image) {
      files.push({
        name: 'Segmented Image',
        filename: 'segmented_wound.jpg',
        url: scanData.processed_image,
        type: 'Image',
        description: 'Wound segmentation result'
      });
    }

    // Depth map (8-bit)
    if (scanData?.depth_map_8bit) {
      files.push({
        name: '8-bit Depth Map',
        filename: 'depth_map_8bit.png',
        url: scanData.depth_map_8bit,
        type: 'Image',
        description: 'ZoeDepth analysis result (8-bit)'
      });
    }

    // Depth map (16-bit)
    if (scanData?.depth_map_16bit) {
      files.push({
        name: '16-bit Depth Map',
        filename: 'depth_map_16bit.png',
        url: scanData.depth_map_16bit,
        type: 'Image',
        description: 'ZoeDepth analysis result (16-bit)'
      });
    }

    // STL file
    if (scanData?.stl_file_url) {
      const fileSize = scanData?.mesh_metadata?.file_size_mb ? `${scanData.mesh_metadata.file_size_mb} MB` : '';
      files.push({
        name: 'STL 3D Model',
        filename: 'wound_model.stl',
        url: scanData.stl_file_url,
        type: '3D Model',
        description: `3D printable mesh ${fileSize}`.trim()
      });
    }

    // STL preview image
    if (scanData?.stl_preview_url) {
      files.push({
        name: 'STL Preview',
        filename: 'stl_preview.png',
        url: scanData.stl_preview_url,
        type: 'Image',
        description: '3D mesh visualization'
      });
    }

    return files;
  };

  const availableFiles = getAvailableFiles();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Patients List')}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Download Files</Text>

        {/* Success Message */}
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>YOUR FILES ARE READY!</Text>
          <Text style={styles.successSubtitle}>
            Processing complete. {availableFiles.length} file{availableFiles.length !== 1 ? 's' : ''} available for download.
          </Text>
        </View>

        {/* Files List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.filesContainer}>
            {availableFiles.length > 0 ? (
              availableFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileType}>{file.type}</Text>
                    <Text style={styles.fileDescription}>{file.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => downloadFile(file.url, file.filename)}
                  >
                    <Text style={styles.downloadButtonText}>Download</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noFilesContainer}>
                <Text style={styles.noFilesText}>No files available for download</Text>
                <Text style={styles.noFilesSubtext}>
                  Please ensure all processing steps have been completed.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Download All Button */}
        {availableFiles.length > 0 && (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.downloadAllButton} onPress={downloadAllFiles}>
              <Text style={styles.downloadAllButtonText}>DOWNLOAD ALL</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 20,
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  successContainer: {
    backgroundColor: '#E8F5E8',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  successSubtitle: {
    fontSize: 14,
    color: '#388E3C',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  scrollView: {
    flex: 1,
  },
  filesContainer: {
    paddingBottom: 20,
  },
  fileItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fileInfo: {
    flex: 1,
    marginRight: 15,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  fileType: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  fileDescription: {
    fontSize: 12,
    color: '#888888',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  noFilesContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noFilesText: {
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
  noFilesSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
  buttonWrapper: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  downloadAllButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  downloadAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.select({
      ios: 'Urbanist',
      android: 'Urbanist',
      default: 'sans-serif',
    }),
  },
});

export default DownloadFilesScreen; 