import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const TestPrinterList = () => {
  return (
    <View style={[styles.container, className]}>
      {/* Hydroprint Title */}
      <View style={styles.hydroprintContainer}>
        <Text style={styles.hydroprintText}>
          <Text style={styles.hydro}>Hydro</Text>
          <Text style={styles.print}>print</Text>
        </Text>
      </View>

      {/* Printer Information */}
      <View style={styles.rectangle}>
        <Text style={styles.printerTitle}>Printer</Text>
        <View style={styles.printerRow}>
          <View style={styles.vectorContainer}>
            <Image 
              source={require('./t007_assets/Tick.png')} 
              style={styles.vectorIcon} 
            />
          </View>
          <Text>NUS_Printer_EA</Text>
        </View>
      </View>

      {/* Additional Printer Options */}
      <View style={styles.rectangleSecondary}>
        <Text style={styles.secondaryPrinterTitle}>NUS_NUH_Printer</Text>
        
        <View style={styles.printerOptionsContainer}>
          <View style={styles.printerOptionRow}>
            <Image 
              source={require('./t007_assets/Line 11.png')} 
              style={styles.line} 
            />
            <Text style={styles.printerName}>NUS_Bio_Printer</Text>
          </View>
          
          <View style={styles.printerOptionRow}>
            <Image 
              source={require('./t007_assets/Line 11.png')} 
              style={styles.line} 
            />
            <Text style={styles.printerName}>NTU_Printer</Text>
          </View>

          <View style={styles.printerOptionRow}>
            <Image 
              source={require('./t007_assets/Line 11.png')} 
              style={styles.line} 
            />

            <Text style={styles.findMorePrinters}>Find More Printers...</Text>
          </View>
        </View>
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <Image 
          source={require('./t007_assets/BackButton.png')} 
          style={styles.arrowIcon} 
        />
      </View>

      {/* Other Printers Label */}
      <Text style={styles.otherPrintersText}>Other Printers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'whitesmoke',
    paddingVertical: 28,
    paddingHorizontal: 8,
    position: 'relative',
    width: '100%',
    fontFamily: 'Inter',
    rowGap: 52,
  },
  hydroprintContainer: {
    position: 'absolute',
    left: 17,
    top: 5,
    height: 36,
  },
  hydroprintText: {
    fontSize: 30,
    fontWeight: '700',
  },
  hydro: {
    color: 'royalblue',
  },
  print: {
    fontStyle: 'italic',
    color: 'midnightblue',
  },
  rectangle: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
    fontSize: 20,
    rowGap: 4,
  },
  printerTitle: {
    fontWeight: '700',
  },
  printerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    maxHeight: 24,
  },
  vectorContainer: {
    alignItems: 'center',
    paddingTop: 1,
  },
  vectorIcon: {
    width: 22,
    height: 19,
  },
  rectangleSecondary: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 45,
    rowGap: 7,
    justifyContent: 'center',
  },
  secondaryPrinterTitle: {
    fontSize: 20,
  },
  printerOptionsContainer: {
    rowGap: 7,
  },
  printerOptionRow: {
    flexDirection: 'column',
    rowGap: 12,
    maxWidth: 212,
  },
  line: {
    alignSelf: 'stretch',
    height: 1,
  },
  printerName: {
    fontSize: 20,
  },
  findMorePrinters: {
    fontSize: 15,
    color: 'darkslategray',
    fontStyle: 'italic',
  },
  arrowContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 81,
    paddingHorizontal: 13,
  },
  arrowIcon: {
    width: 47,
    height: 44,
  },
  otherPrintersText: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: [{ translateY: -9.5 }, { translateY: -111.5 }],
    height: 19,
  },
});


export default TestPrinterList;