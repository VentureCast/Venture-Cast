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
import { useStripe } from '../StripeProvider';

type RootStackParamList = {
  WithdrawCongrats: undefined;
  AddBankAccount: undefined;
  KYCOnboarding: undefined;
};

const WithdrawScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    balance,
    bankAccounts,
    createWithdrawal,
    refreshBalance,
    needsOnboarding,
    canWithdraw,
    isLoading,
    error,
  } = useStripe();

  const [investmentAmount, setInvestmentAmount] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string | null>(
    null
  );

  // Select default bank account on load
  useEffect(() => {
    const defaultAccount = bankAccounts.find((ba) => ba.isDefault);
    if (defaultAccount) {
      setSelectedBankAccount(defaultAccount.id);
    } else if (bankAccounts.length > 0) {
      setSelectedBankAccount(bankAccounts[0].id);
    }
  }, [bankAccounts]);

  const availableBalance = (balance?.available || 0) / 100;

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

  const getSelectedBankAccountInfo = () => {
    const account = bankAccounts.find((ba) => ba.id === selectedBankAccount);
    if (account) {
      return `${account.bankName} •••• ${account.last4}`;
    }
    return 'No bank account selected';
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      if (needsOnboarding) {
        Alert.alert(
          'Setup Required',
          'Please complete account verification before withdrawing.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Complete Setup',
              onPress: () => navigation.navigate('KYCOnboarding'),
            },
          ]
        );
      } else if (bankAccounts.length === 0) {
        Alert.alert(
          'Bank Account Required',
          'Please add a bank account before withdrawing.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Bank Account',
              onPress: () => navigation.navigate('AddBankAccount'),
            },
          ]
        );
      }
      return;
    }

    if (amountInCents < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal is $1.00');
      return;
    }

    if (investmentNumber > availableBalance) {
      Alert.alert('Insufficient Funds', 'You do not have enough balance for this withdrawal.');
      return;
    }

    setIsProcessing(true);

    try {
      const success = await createWithdrawal(
        amountInCents,
        selectedBankAccount || undefined
      );

      if (success) {
        await refreshBalance();
        navigation.navigate('WithdrawCongrats');
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (err: any) {
      Alert.alert(
        'Withdrawal Failed',
        err.message || 'Please try again later.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidAmount = amountInCents >= 100 && investmentNumber <= availableBalance;
  const isOverBalance = investmentNumber > availableBalance;

  const getMessage = () => {
    if (investmentNumber === 0) {
      return 'Enter amount to withdraw';
    }
    if (amountInCents < 100) {
      return 'Minimum withdrawal is $1.00';
    }
    if (isOverBalance) {
      return 'Not enough cash for withdrawal';
    }
    return `${formatCurrency(investmentNumber)} will be deposited into your bank account.`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
      </View>

      {/* Bank Account Info */}
      <TouchableOpacity
        style={styles.bankAccountSection}
        onPress={() => navigation.navigate('AddBankAccount' as any)}
      >
        <View style={styles.leftContainer}>
          <Image
            source={require('../Assets/Icons/Chase.png')}
            style={styles.bankIcon}
          />
          <View style={styles.textContainer}>
            <Text style={styles.bankLabel}>Withdraw To</Text>
            <Text style={styles.bankInfo}>{getSelectedBankAccountInfo()}</Text>
          </View>
        </View>
        <Image
          source={require('../Assets/Icons/EditHR.png')}
          style={styles.edit}
        />
      </TouchableOpacity>

      {/* Balance Display */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Available for Withdrawal</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
      </View>

      {/* Investment Input */}
      <View style={styles.investmentContainer}>
        <View style={styles.investmentBox}>
          <Text
            style={[
              styles.investmentAmount,
              isOverBalance ? styles.negative : null,
            ]}
          >
            {formatCurrencyTextbox(investmentNumber)}
          </Text>
        </View>
        <Text
          style={[
            styles.cashAvailable,
            isOverBalance ? styles.negativeText : null,
          ]}
        >
          {getMessage()}
        </Text>
      </View>

      {/* Withdrawal Time Notice */}
      <View style={styles.noticeSection}>
        <Text style={styles.noticeText}>
          💡 Withdrawals typically arrive in 1-3 business days
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          (!isValidAmount || isProcessing || isLoading) &&
            styles.continueButtonDisabled,
        ]}
        onPress={handleWithdraw}
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
  bankAccountSection: {
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
  bankIcon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  bankLabel: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'urbanist',
  },
  bankInfo: {
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
  negativeText: {
    color: '#F75555',
  },
  noticeSection: {
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 14,
    color: '#856404',
    fontFamily: 'urbanist',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
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

export default WithdrawScreen;
