import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Camera } from 'expo-camera';

const CameraPage = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    if (cameraRef && isCameraReady) {
      const photo = await cameraRef.takePictureAsync();
      console.log(photo.uri);
      // You can use the captured photo (e.g., display it or save it)
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        ref={ref => setCameraRef(ref)}
        onCameraReady={handleCameraReady}
      />

      {/* Overlay UI Elements */}
      <View style={styles.overlayContainer}>
        {/* Patient Info */}
        <View style={styles.patientInfo}>
          <Text style={styles.patientInfoTitle}>Selected Patient</Text>
          <View style={styles.patientInfoTextContainer}>
            <Text style={styles.patientName}>John Wang</Text>
            <Text style={styles.patientID}>SXXX5461</Text>
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>ImgGPT 2</Text>
          <Text style={styles.footerText}>ImgGPT 1</Text>
          <Text style={styles.footerText}>LIDAR</Text>

          {/* Capture Button */}
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.actionButtonLeft}>
            <View style={styles.innerActionButton} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonRight}>
            <View style={styles.innerActionButton} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#272727',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#272727',
    zIndex: 1,
  },
  patientInfo: {
    marginBottom: 20,
  },
  patientInfoTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  patientInfoTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  patientName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '400',
  },
  patientID: {
    color: 'white',
    fontSize: 20,
    fontWeight: '400',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '400',
  },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -25,
    width: 49,
    height: 49,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 41.6,
    height: 41.6,
    backgroundColor: '#D9D9D9',
    borderRadius: 50,
  },
  actionButtonLeft: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: 33.33,
    height: 33.33,
    backgroundColor: 'white',
  },
  actionButtonRight: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 33.33,
    height: 33.33,
    backgroundColor: '#F8F8F8',
  },
  innerActionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#F8F8F8',
  },
});

export default CameraPage;
