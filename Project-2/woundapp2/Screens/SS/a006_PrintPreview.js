import React from "react";
import { View, Text, StyleSheet } from "react-native"


const PrintPreview = () => {
    return (
        <>
      <View style={styles.notificationIconContainer}>
        <View style={styles.notificationIcon} />
      </View>


      <Text style={styles.previewText}>Print preview</Text>
      <View style={styles.previewBackground} />
      <View style={styles.previewBox} />


      <View style={styles.footerAction}>
        <View style={styles.footerSquareButton} />
        <View style={styles.footerTriangle} />
        <View style={styles.footerCircleButtonContainer}>
          <View style={styles.footerCircleButton} />
        </View>
      </View>
        </>

    )
}


const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    position: 'relative',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    marginTop: 10,
    position: 'absolute',
    top: 5,
    left: 17,
  },
  logoTextPrimary: {
    color: '#2864DA',
    fontSize: 30,
    fontWeight: '700',
  },
  logoTextSecondary: {
    color: '#0D2B64',
    fontSize: 30,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  notificationIconContainer: {
    position: 'absolute',
    top: 5,
    right: 17,
  },
  notificationIcon: {
    width: 29.5,
    height: 31.36,
    backgroundColor: 'black',
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
  footerAction: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerSquareButton: {
    width: 41,
    height: 41,
    backgroundColor: 'black',
  },
  footerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderBottomWidth: 38,
    borderBottomColor: 'black',
    backgroundColor: 'transparent',
    marginLeft: 50,
    transform: [{ rotate: '180deg' }],
  },
  footerCircleButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 68,
    height: 68,
    padding: 8.5,
    position: 'absolute',
    top: -16,
    left: 126,
  },
  footerCircleButton: {
    width: 59.5,
    height: 51.05,
    backgroundColor: 'black',
  },
});

export default PrintPreview;