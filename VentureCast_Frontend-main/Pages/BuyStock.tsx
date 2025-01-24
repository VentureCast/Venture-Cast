import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatCurrency from './Components/formatCurrency';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  BuyPreview: undefined;
  ClipsPage: undefined;
  short: undefined;
};

const BuyStockScreen = ({ }:any) => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const user = {firstName: 'Alexander', lastName: 'Creighton', cash: 23087.39, accountNumber: '**** **** **** 4321',
   stockName: 'DUPT', stockLongName: 'Dude Perfect', stockCost: 71.50}; //user data

  const [investmentAmount, setInvestmentAmount] = useState('0');

  const formatNumberTextbox = (number: number): string => {
    return number.toLocaleString('en-US');
  };

  const formatCurrencyTextbox = (number: number): string => {
    return `$${formatNumberTextbox(number)}`;
  };

  const handlePress = (item: string | number) => {
    setInvestmentAmount((prev) => {
      const currentValue = prev.toString(); // Keep the current value as a string
  
      // Handle backspace
      if (item === '⌫') {
        const newValue = currentValue.slice(0, -1); // Remove the last character
        return newValue === '' ? '0' : newValue; // Return '0' if empty, otherwise keep it as a string
      }
  
      // Handle decimal point
      if (item === '.') {
        if (currentValue.includes('.')) {
          return currentValue; // Ignore if a decimal point already exists
        }
        return currentValue + '.'; // Append the decimal point
      }
  
      // Append numbers
      if (typeof item === 'number' || !isNaN(Number(item))) {
        if (currentValue === '0') {
          return item.toString(); // Replace '0' with the input number
        }
        return currentValue + item.toString(); // Append the number to the string
      }
  
      return currentValue; // Return unchanged if input is invalid
    });


  };
  const investmentNumber = parseFloat(investmentAmount)

  const message = () => {
    if (user.cash < investmentNumber) {
      return ("Not enough cash for purchase")
    } else {
      return (formatCurrency(investmentNumber) + ` worth of ${user.stockName} will be purchased`)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Back</Text>
      </View>

      {/* Stock Info */}
      <View style={styles.stockInfo}>
        <View  style={styles.leftContainer}>
          <Image
            source={require('../Assets/Images/dude-perfect.png')} // Update with your stock image
            style={styles.stockLogo}
          />
          <View>
            <Text style={styles.stockName}>{user.stockLongName}</Text>
            <Text style={styles.stockTicker}>{user.stockName}</Text>
          </View>
        </View>
        <Text style={styles.marketPrice}>{formatCurrency(user.stockCost)}</Text>
      </View>

      {/* Investment Input */}
      <View style={styles.investmentContainer}>
        <Text style={styles.cashAvailable}>
          Cash Available: {formatCurrency(user.cash)}
        </Text>
        <View style={styles.investmentBox}>
          <Text style={[styles.investmentAmount, investmentNumber > user.cash ? styles.negative : styles.positive]}>{formatCurrencyTextbox(investmentNumber)}</Text>
        </View>
        <Text style={styles.cashAvailable}>
        {message()}
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={()=> {
            navigation.navigate('BuyPreview') // withdraw/deposit preview
        }}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {['1', '2', '3', '4', '5', '6', '7', '8','9', '.', '0', '⌫'].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.numberKey}
            onPress={() => {
              if (item !== '*') {
                handlePress(item);
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
  leftContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 60,
  },
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
  },
  headerTitle: {
    fontSize: 22,
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
    width: 60,
    height: 60,
    marginRight: 10,
  },
  stockName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
    padding: 40,
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
    borderRadius: 12,
  },
  shareText: {
    color: '#333',
    fontFamily: 'urbanist',
  },
  continueButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    borderRadius: 20,
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
    borderRadius: 20,
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
  positive: {

  },
  negative: {
    color: '#F75555',
  },
});

export default BuyStockScreen;
