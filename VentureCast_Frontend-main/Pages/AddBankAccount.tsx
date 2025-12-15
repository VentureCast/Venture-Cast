import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useStripe } from '../StripeProvider';

type RootStackParamList = {
  PaymentMethods: undefined;
};

const AddBankAccount = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { addBankAccount, isLoading, error } = useStripe();

  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>(
    'checking'
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const validateRoutingNumber = (number: string): boolean => {
    // US routing numbers are exactly 9 digits
    return /^\d{9}$/.test(number);
  };

  const validateAccountNumber = (number: string): boolean => {
    // Account numbers are typically 4-17 digits
    return /^\d{4,17}$/.test(number);
  };

  const isFormValid = (): boolean => {
    return (
      validateRoutingNumber(routingNumber) &&
      validateAccountNumber(accountNumber) &&
      accountNumber === confirmAccountNumber &&
      accountHolderName.trim().length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      let errorMessage = 'Please fix the following issues:\n';

      if (!validateRoutingNumber(routingNumber)) {
        errorMessage += '• Routing number must be 9 digits\n';
      }
      if (!validateAccountNumber(accountNumber)) {
        errorMessage += '• Account number must be 4-17 digits\n';
      }
      if (accountNumber !== confirmAccountNumber) {
        errorMessage += '• Account numbers do not match\n';
      }
      if (accountHolderName.trim().length === 0) {
        errorMessage += '• Account holder name is required\n';
      }

      Alert.alert('Invalid Input', errorMessage);
      return;
    }

    setIsProcessing(true);

    try {
      const success = await addBankAccount(
        routingNumber,
        accountNumber,
        accountHolderName.trim()
      );

      if (success) {
        Alert.alert('Success', 'Bank account added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error(error || 'Failed to add bank account');
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message || 'Failed to add bank account. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Bank Account</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            🔒 Your banking information is securely transmitted and stored by
            Stripe, our payment partner.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          {/* Account Holder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Routing Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Routing Number</Text>
            <TextInput
              style={[
                styles.input,
                routingNumber.length > 0 &&
                  !validateRoutingNumber(routingNumber) &&
                  styles.inputError,
              ]}
              placeholder="123456789"
              value={routingNumber}
              onChangeText={(text) => setRoutingNumber(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={9}
            />
            {routingNumber.length > 0 && !validateRoutingNumber(routingNumber) && (
              <Text style={styles.errorHint}>Must be 9 digits</Text>
            )}
          </View>

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={[
                styles.input,
                accountNumber.length > 0 &&
                  !validateAccountNumber(accountNumber) &&
                  styles.inputError,
              ]}
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={17}
              secureTextEntry
            />
            {accountNumber.length > 0 &&
              !validateAccountNumber(accountNumber) && (
                <Text style={styles.errorHint}>Must be 4-17 digits</Text>
              )}
          </View>

          {/* Confirm Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Account Number</Text>
            <TextInput
              style={[
                styles.input,
                confirmAccountNumber.length > 0 &&
                  accountNumber !== confirmAccountNumber &&
                  styles.inputError,
              ]}
              placeholder="Re-enter account number"
              value={confirmAccountNumber}
              onChangeText={(text) =>
                setConfirmAccountNumber(text.replace(/\D/g, ''))
              }
              keyboardType="number-pad"
              maxLength={17}
              secureTextEntry
            />
            {confirmAccountNumber.length > 0 &&
              accountNumber !== confirmAccountNumber && (
                <Text style={styles.errorHint}>Account numbers don't match</Text>
              )}
          </View>

          {/* Account Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.accountTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'checking' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setAccountType('checking')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    accountType === 'checking' && styles.accountTypeTextActive,
                  ]}
                >
                  Checking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'savings' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setAccountType('savings')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    accountType === 'savings' && styles.accountTypeTextActive,
                  ]}
                >
                  Savings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            By adding this bank account, you authorize VentureCast to initiate
            debit and credit transactions to this account. This authorization
            will remain in effect until you remove the bank account.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid() || isProcessing || isLoading) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || isProcessing || isLoading}
        >
          {isProcessing || isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Bank Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'white',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoBanner: {
    backgroundColor: '#E8F4FD',
    padding: 15,
    borderRadius: 12,
    marginVertical: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    fontFamily: 'urbanist',
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'urbanist',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: 'urbanist',
    backgroundColor: '#F8F8F8',
  },
  inputError: {
    borderColor: '#F75555',
    backgroundColor: '#FFF5F5',
  },
  errorHint: {
    color: '#F75555',
    fontSize: 12,
    fontFamily: 'urbanist',
    marginTop: 5,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  accountTypeButtonActive: {
    borderColor: '#351560',
    backgroundColor: '#F5F0FA',
  },
  accountTypeText: {
    fontSize: 16,
    fontFamily: 'urbanist',
    color: '#757575',
  },
  accountTypeTextActive: {
    color: '#351560',
    fontWeight: '600',
  },
  disclaimerSection: {
    marginBottom: 30,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'urbanist',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#351560',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
});

export default AddBankAccount;
