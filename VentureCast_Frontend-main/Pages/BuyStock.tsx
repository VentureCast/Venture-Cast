import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  BuyPreview: undefined;
  ClipsPage: undefined;
  short: undefined;
};

const BuyStockScreen = ({ }:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [investmentAmount, setInvestmentAmount] = useState('10000');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy</Text>
      </View>

      {/* Stock Info */}
      <View style={styles.stockInfo}>
        <Image
          source={require('../Assets/Images/JimmyBeast.png')} // Update with your stock image
          style={styles.stockLogo}
        />
        <View>
          <Text style={styles.stockName}>Mr. Beast?</Text>
          <Text style={styles.stockTicker}>Has Crohns?</Text>
        </View>
        <Text style={styles.marketPrice}>$71.05</Text>
      </View>

      {/* Investment Input */}
      <View style={styles.investmentContainer}>
        <View style={styles.investmentBox}>
          <Text style={styles.investmentAmount}>${investmentAmount}</Text>
        </View>
        <Text style={styles.cashAvailable}>
          Cash Available for Investment: $23,087.39
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareText}>140.74 Share for</Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={()=> {
            navigation.navigate('BuyPreview')
        }}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '⌫'].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.numberKey}
            onPress={() => {
              if (item === '⌫') {
                setInvestmentAmount((prev) => prev.slice(0, -1));
              } else {
                setInvestmentAmount((prev) => prev + item);
              }
            }}>
            <Text style={styles.numberText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 60,
  },
  backButton: {
    fontSize: 24,
    color: '#000',
    fontFamily: 'urbanist',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    fontFamily: 'urbanist',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  stockLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  stockName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'urbanist',

  },
  stockTicker: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'urbanist',

  },
  marketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',

  },
  investmentContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  investmentBox: {
    width: '100%',
    padding: 30,
    borderWidth: 2,
    borderColor: '#A0A0A0',
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  investmentAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'urbanist',

  },
  cashAvailable: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    fontFamily: 'urbanist',

  },
  shareButton: {
    backgroundColor: '#D1D1F7', // Button background color
    padding: 10,
    borderRadius: 5,
  },
  shareText: {
    color: '#333',
    fontFamily: 'urbanist',
  },
  continueButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  continueText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'urbanist',

  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  numberKey: {
    width: '30%',
    padding: 20,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white', // Match the background color
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
  },
  numberText: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
});

export default BuyStockScreen;
