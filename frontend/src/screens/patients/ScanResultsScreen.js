import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Svg, Path, Rect } from 'react-native-svg';
import { BackArrowIcon } from '../../components/ui';
import { scanService } from '../../services';
import { API_BASE_URL } from '@env';

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

const ScanResultsScreen = ({ route, navigation }) => {
  // Safely access patientId from route params
  const patientId = route.params?.patientId;
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      console.warn('ScanResultsScreen loaded without a patientId parameter.');
      setIsLoading(false);
      return;
    }
    
    fetchPatientScans();
  }, [patientId]);

  const fetchPatientScans = async () => {
    try {
      console.log(`[ScanResultsScreen] Fetching scans for patient ID: ${patientId}`);
      setIsLoading(true);
      
      // Fetch scans filtered by patient
      const scansData = await scanService.getScans({ patient: patientId });
      console.log(`[ScanResultsScreen] Fetched ${scansData.length} scans for patient`);
      
      // Debug: Log the structure of the first scan if available
      if (scansData.length > 0) {
        console.log('[ScanResultsScreen] Sample scan data structure:', {
          id: scansData[0].id,
          is_processed: scansData[0].is_processed,
          has_results: scansData[0].has_results,
          result: scansData[0].result ? {
            stl_file: scansData[0].result.stl_file,
            preview_image: scansData[0].result.preview_image,
            file_sizes: scansData[0].result.file_sizes
          } : null
        });
      }
      
      // Filter only scans with actual STL files
      const scansWithSTL = scansData.filter(scan => {
        return scan.result && scan.result.stl_file && scan.result.stl_file.trim() !== '';
      });
      console.log(`[ScanResultsScreen] Filtered to ${scansWithSTL.length} scans with STL files`);
      setScans(scansWithSTL);
      
    } catch (error) {
      console.error('[ScanResultsScreen] Error fetching scans:', error);
      Alert.alert('Error', 'Failed to load scan results.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = async (scan) => {
    try {
      // Get STL file URL from scan result
      const stlFileUrl = scan.result?.stl_file;
      
      if (!stlFileUrl) {
        Alert.alert('Error', 'STL file not available for download');
        return;
      }

      // Construct the download URL using the same logic as the API service
      let downloadUrl = stlFileUrl;
      if (!stlFileUrl.startsWith('http://') && !stlFileUrl.startsWith('https://')) {
        // Use the same base URL configuration as the API service
        const baseUrl = API_BASE_URL ? `http://${API_BASE_URL}:8000` : 'http://127.0.0.1:8000';
        downloadUrl = stlFileUrl.startsWith('/') ? `${baseUrl}${stlFileUrl}` : `${baseUrl}/${stlFileUrl}`;
      }

      // Generate filename
      const patientName = scan.patient_name || 'Patient';
      const scanNumber = scan.scan_attempt_number || scan.id;
      const filename = `${patientName.replace(/\s+/g, '_')}_Scan_${scanNumber.toString().padStart(3, '0')}.stl`;

      console.log(`Downloading ${filename} from:`, downloadUrl);
      
      // Open the URL in the browser/default app for download
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
        Alert.alert('Download Started', `${filename} download has been initiated`);
      } else {
        Alert.alert('Error', `Cannot open download URL`);
      }
    } catch (error) {
      console.error('Error downloading STL file:', error);
      Alert.alert('Download Error', `Failed to download STL file: ${error.message}`);
    }
  };

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
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <Text style={styles.subTitle}>Previous Scans</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#27CFA0" />
              <Text style={styles.loadingText}>Loading scan results...</Text>
            </View>
          ) : scans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No scan results found</Text>
              <Text style={styles.emptySubText}>
                Complete a scan to see results here
              </Text>
            </View>
          ) : (
            scans.map((scan) => {
              const scanNumber = scan.scan_attempt_number || scan.id;
              const fileSize = scan.result?.file_sizes?.stl_file || 0;
              
              // Get patient name for display
              const patientName = scan.patient_name || 'Unknown Patient';
              
              // Check if scan has actual STL file
              const hasSTLFile = scan.result?.stl_file;
              const hasPreview = scan.result?.preview_image;
              
              return (
                <View key={scan.id} style={styles.scanCard}>
                  {/* Scan Card Header */}
                  <View style={styles.scanCardHeader}>
                    <Text style={styles.scanCardTitle}>Scan #{scanNumber.toString().padStart(3, '0')}</Text>
                    <Text style={styles.scanCardDate}>{formatDate(scan.created_at)}</Text>
                  </View>
                  
                  {/* Inner File Info Box */}
                  <View style={styles.fileBox}>
                    <LeftDownloadIcon />
                    <View style={styles.fileInfoTextContainer}>
                      <Text style={styles.fileName}>
                        {hasSTLFile ? `${patientName} STL` : 'No STL Available'}
                      </Text>
                      <Text style={styles.fileDetails}>
                        {hasSTLFile 
                          ? `3D Model • ${formatFileSize(fileSize * 1024 * 1024)}`
                          : 'Processing incomplete'
                        }
                      </Text> 
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.downloadButtonRight,
                        !hasSTLFile && styles.downloadButtonDisabled
                      ]}
                      onPress={() => hasSTLFile && handleDownload(scan)}
                      disabled={!hasSTLFile}
                    >
                      <RightDownloadIcon />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
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
    paddingBottom: 30, // Add bottom padding for better scrolling
    flexGrow: 1, // Ensure content container grows to fill available space
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
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default ScanResultsScreen; 