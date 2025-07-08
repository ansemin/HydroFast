import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";

import { LogoHeader, BackButton, PrintPawPrint, SettingsIcon } from '../../components';

const PrintPreviewScreen = () => {
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
        <LogoHeader />
      </View>

      <Text style={styles.previewText}>Print preview</Text>
      <View style={styles.previewBackground} />
      <View style={styles.previewBox} />

      <View style={styles.bottomBar}>
        <BackButton />
        <TouchableOpacity onPress={handlePrintPawPrint}>
          <PrintPawPrint />
        </TouchableOpacity>
        <SettingsIcon />
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
    </>
  );
};

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

export default PrintPreviewScreen; 