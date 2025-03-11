import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback  } from "react-native"

import LogoHeader from './a001b_LogoHeader';
import { BackButton, PrintPawPrint, SettingsIcon} from '../components/Icons';


const PrintPreview = () => {

  const [modalVisible, setModalVisible] = useState(false);

  // Function to handle "Printing" popup
  const handlePrintPawPrint = () => {
    setModalVisible(true);
    setTimeout(() => {
      setModalVisible(false);
    }, 10000); // 10 seconds
  };

    return (
        <>
      <View style={styles.logoContainer}>
        <LogoHeader/>
      </View>
      


      <Text style={styles.previewText}>Print preview</Text>
      <View style={styles.previewBackground} />
      <View style={styles.previewBox} />

      <View style={styles.bottomBar}>
        {/* <View style={styles.bottomBarIconLeft} /> */}
        <BackButton/>
        <TouchableOpacity onPress={handlePrintPawPrint}>
          <PrintPawPrint/>
        </TouchableOpacity>

        <SettingsIcon/>
        {/* <View style={styles.bottomBarIcon} /> */}
        {/* <HomeIcon />
        <CameraIcon /> */}
        {/* <View style={styles.bottomBarIconMiddle} /> */}
      </View>
      
      {/* Modal for Printing */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Printing... Please wait 10 seconds</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* <View style={styles.footerAction}>
        <View style={styles.footerSquareButton} />
        <View style={styles.footerTriangle} />
        <View style={styles.footerCircleButtonContainer}>
          <View style={styles.footerCircleButton} />
        </View>
      </View> */}
        </>

    )
}


const styles = StyleSheet.create({
  logoContainer: {
    marginLeft: 17,
  },
  previewText: {
    position: 'absolute',
    top: 56,
    left: 17,
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
  },
  previewBackground: {
    width: '100%',
    height: 369,
    backgroundColor: '#4F4F4F',
    position: 'absolute',
    top: 89,
    left: 0,
  },
  previewBox: {
    width: 190,
    height: 216,
    backgroundColor: '#B8DB09',
    position: 'absolute',
    top: 141,
    left: 46,
  },
  bottomBar: {
    width: '100%',
    height: 70,
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bottomBarIconLeft: {
    width: 51,
    height: 46,
    backgroundColor: 'black',
  },
  bottomBarIcon: {
    width: 51,
    height: 46,
    backgroundColor: 'black',
  },
  bottomBarIconMiddle: {
    width: 49,
    height: 49,
    backgroundColor: 'black',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 200,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    color: 'black',
  },
});

export default PrintPreview;