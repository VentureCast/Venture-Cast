import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp, useRoute, RouteProp } from '@react-navigation/native';
import formatCurrency from './Components/formatCurrency';
import { useUser } from '../UserProvider';
import api from '../services/api';

type RootStackParamList = {
  SellPreview: undefined;
  SellCongrats: undefined;
};

const SellStock = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: { streamerId?: string; stockName?: string; stockLongName?: string; stockCost?: number; sharesOwned?: number } }, 'params'>>();
  const { user, token } = useUser();

  const streamerId = route.params?.streamerId || '';
  const stockName = route.params?.stockName || 'N/A';
  const stockLongName = route.params?.stockLongName || 'Unknown';
  const stockCost = route.params?.stockCost || 0;
  const sharesOwned = route.params?.sharesOwned || 0;

  const equityValue = sharesOwned * stockCost;

  const [investmentAmount, setInvestmentAmount] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && token) {
      api.setToken(token);
      api.setUserId(user._id);
    }
  }, [user, token]);

  const formatNumberTextbox = (number: number): string => {
    return number.toLocaleString('en-US');
  };

  const formatCurrencyTextbox = (number: number): string => {
    return `$${formatNumberTextbox(number)}`;
  };

  const handlePress = (item: string | number) => {
    setInvestmentAmount((prev) => {
      const currentValue = prev.toString();

      if (item === '⌫') {
        const newValue = currentValue.slice(0, -1);
        return newValue === '' ? '0' : newValue;
      }

      if (item === '.') {
        if (currentValue.includes('.')) {
          return currentValue;
        }
        return currentValue + '.';
      }

      if (typeof item === 'number' || !isNaN(Number(item))) {
        if (currentValue === '0') {
          return item.toString();
        }
        return currentValue + item.toString();
      }

      return currentValue;
    });
  };

  const investmentNumber = parseFloat(investmentAmount);
  const sharesToSell = stockCost > 0 ? Math.floor(investmentNumber / stockCost) : 0;

  const message = () => {
    if (investmentNumber > equityValue) {
      return 'Not enough equity for sale';
    } else if (investmentNumber <= 0) {
      return 'Enter an amount to sell';
    } else {
      return `${sharesToSell} share${sharesToSell !== 1 ? 's' : ''} of ${stockName} will be sold at ${formatCurrency(stockCost)}/share`;
    }
  };

  const handleSell = async () => {
    if (investmentNumber <= 0 || sharesToSell <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid sell amount.');
      return;
    }

    if (sharesToSell > sharesOwned) {
      Alert.alert('Insufficient Shares', `You only own ${sharesOwned} shares.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.sellShares(streamerId, sharesToSell);

      if (result.success) {
        Alert.alert(
          'Order Executed',
          `Sold ${sharesToSell} shares of ${stockName} at ${formatCurrency(result.transaction.pricePerShare)}/share.\n\nProceeds: ${formatCurrency(result.transaction.totalProceeds)}\nNew Balance: ${formatCurrency(result.transaction.newBalance)}`,
          [{ text: 'OK', onPress: () => navigation.navigate('SellCongrats') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Trade Failed', error.message || 'Failed to execute sell order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <View style={styles.leftContainer}>
          <Image
            source={require('../Assets/Images/dude-perfect.png')}
            style={styles.stockLogo}
          />
          <View>
            <Text style={styles.stockName}>{stockLongName}</Text>
            <Text style={styles.stockTicker}>{stockName}</Text>
          </View>
        </View>
        <Text style={styles.marketPrice}>{formatCurrency(stockCost)}</Text>
      </View>

      {/* Investment Input */}
      <View style={styles.investmentContainer}>
        <Text style={styles.cashAvailable}>
          Equity Available: {formatCurrency(equityValue)} ({sharesOwned} shares)
        </Text>
        <View style={styles.investmentBox}>
          <Text style={[styles.investmentAmount, investmentNumber > equityValue ? styles.negative : styles.positive]}>
            {formatCurrencyTextbox(investmentNumber)}
          </Text>
        </View>
        <Text style={styles.cashAvailable}>
          {message()}
        </Text>
      </View>

      {/* Sell Button */}
      <TouchableOpacity
        style={[styles.continueButton, (submitting || investmentNumber <= 0 || investmentNumber > equityValue) && styles.disabledButton]}
        onPress={handleSell}
        disabled={submitting || investmentNumber <= 0 || investmentNumber > equityValue}
      >
        <Text style={styles.continueText}>
          {submitting ? 'Processing...' : 'Sell'}
        </Text>
      </TouchableOpacity>

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((item, index) => (
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
  continueButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
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
    backgroundColor: 'white',
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
  positive: {},
  negative: {
    color: '#F75555',
  },
});

export default SellStock;
