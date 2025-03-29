import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import LogoHeader from './a001b_LogoHeader';

const ICON_SIZE = 29.5;
const PRINTER_CARD_HEIGHT = 70;
const PRINTER_CARD_WIDTH = 303;
const OTHER_PRINTER_CARD_HEIGHT = 177;
const BORDER_RADIUS = 10;
const FONT_SIZE_LARGE = 20;
const FONT_SIZE_MEDIUM = 16;
const ICON_COLOR = '#2864DA';
const BACKGROUND_COLOR = '#ECECEC';

const PrinterList = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <LogoHeader/>
      </View>


      {/* Printer Section */}
      <View style={styles.printerCard} />
      <Text style={styles.printerText}>Printer</Text>
      <View style={styles.mainPrinterContainer}>
        <Image 
        source={require('./t007_assets/Tick.png')}
        style={styles.mainPrinterIcon}
        />
        <Text style={styles.mainPrinterText}>NUS_Printer_EA</Text>
      </View>

      {/* Other Printers Section */}
      <View style={styles.otherPrintersCard} />
      <Text style={styles.otherPrintersText}>Other Printers</Text>

      <View style={styles.printerItem1}>
        <Text style={styles.printerName}>NUS_NUH_Printer</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.printerItem2}>
        <Text style={styles.printerName}>NUS_Bio_Printer</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.printerItem3}>
        <Text style={styles.printerName}>NTU_Printer</Text>
        <View style={styles.divider} />
      </View>

      {/* Find More Printers */}
      <Text style={styles.findMorePrintersText}>Find More Printers...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: BACKGROUND_COLOR,
    position: 'relative',
  },
  logoContainer: {
    marginLeft: 17,
  },
  logoTextPrimary: {
    color: '#2864DA',
    fontSize: FONT_SIZE_LARGE,
    fontWeight: '700',
  },
  logoTextSecondary: {
    color: '#0D2B64',
    fontSize: FONT_SIZE_LARGE,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  notificationIconContainer: {
    position: 'absolute',
    top: 5,
    right: 17,
  },
  notificationIcon: {
    width: ICON_SIZE,
    height: 31.36,
    backgroundColor: 'black',
  },
  printerCard: {
    width: PRINTER_CARD_WIDTH,
    height: PRINTER_CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS,
    position: 'absolute',
    top: 60,
    left: 10,
  },
  otherPrintersCard: {
    width: PRINTER_CARD_WIDTH,
    height: OTHER_PRINTER_CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS,
    position: 'absolute',
    top: 186,
    left: 8,
  },
  printerText: {
    position: 'absolute',
    top: 62,
    left: 20,
    fontSize: FONT_SIZE_LARGE,
    fontWeight: '700',
    color: 'black',
  },
  mainPrinterContainer: {
    position: 'absolute',
    top: 90,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainPrinterIcon: {
    width: 22,
    height: 19,
    marginRight: 10,
  },
  mainPrinterText: {
    fontSize: FONT_SIZE_LARGE,
    fontWeight: '400',
    color: 'black',
  },
  otherPrintersText: {
    position: 'absolute',
    top: 163,
    left: 14,
    fontSize: FONT_SIZE_MEDIUM,
    fontWeight: '400',
    color: 'black',
  },
  printerItem1: {
    height: 32,
    position: 'absolute',
    top: 200,
    left: 54,
  },
  printerItem2: {
    height: 32,
    position: 'absolute',
    top: 245,
    left: 54,
  },
  printerItem3: {
    height: 32,
    position: 'absolute',
    top: 290,
    left: 54,
  },
  printerName: {
    fontSize: FONT_SIZE_LARGE,
    fontWeight: '400',
    color: 'black',
  },
  divider: {
    width: 212,
    height: 1,
    backgroundColor: 'black',
    marginTop: 10,
  },
  findMorePrintersText: {
    position: 'absolute',
    top: 330,
    left: 54,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#373737',
  },
});

export default PrinterList;
