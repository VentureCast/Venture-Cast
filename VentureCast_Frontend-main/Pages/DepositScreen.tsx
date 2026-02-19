import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useStripe as useStripeHook } from '@stripe/stripe-react-native';
import { useStripe } from '../StripeProvider';

type RootStackParamList = {
  DepositCongrats: undefined;
  AddPayment: undefined;
  KYCOnboarding: undefined;
};

const DepositScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { initPaymentSheet, presentPaymentSheet } = useStripeHook();
  const {
    balance,
    paymentMethods,
    createDeposit,
    confirmDeposit,
    refreshBalance,
    needsOnboarding,
    canDeposit,
    isLoading,
    error,
  } = useStripe();

  const [investmentAmount, setInvestmentAmount] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);

  // Select default payment method on load
  useEffect(() => {
    const defaultMethod = paymentMethods.find((pm) => pm.isDefault);
    if (defaultMethod) {
      setSelectedPaymentMethod(defaultMethod.id);
    } else if (paymentMethods.length > 0) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods]);

  const formatCurrency = (number: number, decimals: number = 2): string => {
    return `$${number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const formatCurrencyTextbox = (number: number): string => {
    return `$${number.toLocaleString('en-US')}`;
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

  const investmentNumber = parseFloat(investmentAmount) || 0;
  const amountInCents = Math.round(investmentNumber * 100);

  const getSelectedPaymentMethodInfo = () => {
    const method = paymentMethods.find((pm) => pm.id === selectedPaymentMethod);
    if (method) {
      return `${method.brand.toUpperCase()} •••• ${method.last4}`;
    }
    return 'No payment method selected';
  };

  const handleDeposit = async () => {
    if (!canDeposit) {
      if (needsOnboarding) {
        Alert.alert(
          'Setup Required',
          'Please complete account verification before making deposits.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Complete Setup',
              onPress: () => navigation.navigate('KYCOnboarding'),
            },
          ]
        );
      } else if (paymentMethods.length === 0) {
        Alert.alert(
          'Payment Method Required',
          'Please add a payment method before making deposits.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Payment',
              onPress: () => navigation.navigate('AddPayment'),
            },
          ]
        );
      }
      return;
    }

    if (amountInCents < 100) {
      Alert.alert('Invalid Amount', 'Minimum deposit is $1.00');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create deposit and get client secret
      const depositResult = await createDeposit(
        amountInCents,
        selectedPaymentMethod || undefined
      );

      if (!depositResult) {
        throw new Error('Failed to create deposit');
      }

      // Step 2: Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: depositResult.clientSecret,
        merchantDisplayName: 'VentureCast',
        style: 'automatic',
        defaultBillingDetails: {
          name: '', // Will be filled by payment sheet
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Step 3: Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          throw new Error(presentError.message);
        }
        // User cancelled - just return
        return;
      }

      // Step 4: Confirm deposit on backend
      await confirmDeposit(depositResult.paymentIntentId);

      // Step 5: Refresh balance and navigate to success
      await refreshBalance();
      navigation.navigate('DepositCongrats');
    } catch (err: any) {
      Alert.alert('Deposit Failed', err.message || 'Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidAmount = amountInCents >= 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
      </View>

      {/* Payment Method Info */}
      <TouchableOpacity
        style={styles.paymentMethodSection}
        onPress={() => navigation.navigate('AddPayment')}
      >
        <View style={styles.leftContainer}>
          <Image
            source={require('../Assets/Icons/Visa.png')}
            style={styles.paymentIcon}
          />
          <View style={styles.textContainer}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentInfo}>{getSelectedPaymentMethodInfo()}</Text>
          </View>
        </View>
        <Image
          source={require('../Assets/Icons/EditHR.png')}
          style={styles.edit}
        />
      </TouchableOpacity>

      {/* Balance Display */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency((balance?.available || 0) / 100)}
        </Text>
      </View>

      {/* Investment Input */}
      <View style={styles.investmentContainer}>
        <View style={styles.investmentBox}>
          <Text
            style={[
              styles.investmentAmount,
              !isValidAmount && investmentNumber > 0 ? styles.negative : null,
            ]}
          >
            {formatCurrencyTextbox(investmentNumber)}
          </Text>
        </View>
        <Text style={styles.cashAvailable}>
          {investmentNumber > 0
            ? isValidAmount
              ? `${formatCurrency(investmentNumber)} will be deposited into your account.`
              : 'Minimum deposit is $1.00'
            : 'Enter amount to deposit'}
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          (!isValidAmount || isProcessing || isLoading) &&
            styles.continueButtonDisabled,
        ]}
        onPress={handleDeposit}
        disabled={!isValidAmount || isProcessing || isLoading}
      >
        {isProcessing || isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueText}>Continue</Text>
        )}
      </TouchableOpacity>

      {/* Error Display */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(
          (item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.numberKey}
              onPress={() => handlePress(item)}
              disabled={isProcessing}
            >
              <Text style={styles.numberText}>{item}</Text>
            </TouchableOpacity>
          )
        )}
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
    marginTop: 40,
    height: 60,
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
  paymentMethodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'column',
  },
  paymentIcon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'urbanist',
  },
  paymentInfo: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'urbanist',
    marginTop: 2,
  },
  edit: {
    width: 20,
    height: 20,
  },
  balanceSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'urbanist',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#12D18E',
    fontFamily: 'urbanist',
    marginTop: 4,
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
  negative: {
    color: '#F75555',
  },
  cashAvailable: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 10,
    fontFamily: 'urbanist',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  continueButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  continueText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
  errorText: {
    color: '#F75555',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
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
    backgroundColor: 'white',
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

export default DepositScreen;
