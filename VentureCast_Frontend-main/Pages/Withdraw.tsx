import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Dropdown from './Components/Dropdown';

type RootStackParamList = {
// will need to navigate to the edit bank info page
BuyPreview: undefined;
};

const Withdraw = ({ }:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const user = {firstName: 'Alexander', lastName: 'Creighton', cash: 23087.39, accountNumber: '**** **** **** 4321'}; //user data

  const [investmentAmount, setInvestmentAmount] = useState('0');

  const formatNumberTextbox = (number: number): string => {
    return number.toLocaleString('en-US');
  };

  const formatNumber = (number: number, decimals: number = 2): string => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (number: number, decimals: number = 2): string => {
    return `$${formatNumber(number, decimals)}`;
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
      return ("Not enough cash for withdraw")
    } else {
      return (formatCurrency(investmentNumber) + ' will be deposited into your bank account.')
    }
  }
  

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
      </View>

      {/* bank Info */}
      <View style={styles.stockInfo}>
        <View style={styles.leftContainer}>
          <Image
            source={require('../Assets/Icons/Visa.png')}
            style={styles.stockLogo}
          />
          <View style={styles.textContainer}>
            <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.acctInfo}>Account: {user.accountNumber}</Text>
          </View>
        </View>
        <Image source={require('../Assets/Icons/EditHR.png')} style={styles.edit} />
      </View>

      {/* Investment Input */}
      <View style={styles.investmentContainer}>
        <Text style={styles.cashAvailable}>
          Cash Available for Withdraw: {formatCurrency(user.cash)}
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
    backgroundColor: 'white', // Light greenish background color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
    height: 100, // temporary to make sure the back arrow is clickable
  },
  backButton: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    marginLeft: 20,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'column',
 
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  stockLogo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  edit: {
    width: 20,
    height: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    marginBottom: 5,
  },
  acctInfo: {
    fontSize: 14,
    color: '#757575',
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
    padding: 36,
    borderWidth: 2,
    borderColor: '#351560',
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  investmentAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
  positive: {

  },
  negative: {
    color: '#F75555',
  },
  cashAvailable: {
    fontSize: 16,
    color: '#757575',
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
    padding: 15,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white', // Match the background color
    borderRadius: 15,
    shadowColor: '#351560',
    shadowOffset: { width: 1, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
  numberText: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
});

export default Withdraw;
