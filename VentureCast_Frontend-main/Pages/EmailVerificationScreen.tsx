import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Button from './Components/Button';

const EmailVerificationScreen = ({navigation}:any) => {
  const [code, setCode] = useState(['', '', '', '']);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
  };

  const handleConfirm = () => {
    // Handle OTP confirmation
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Verification Code</Text>
      <Text>We have sent the OTP verification code to your email. Check your email and enter the code below.</Text>

      <View style={styles.codeInputContainer}>
        {code.map((_, index) => (
          <TextInput
            key={index}
            style={styles.codeInput}
            value={code[index]}
            onChangeText={(text) => handleChange(text, index)}
            maxLength={1}
            keyboardType="numeric"
          />
        ))}
      </View>

      <Text style={styles.resendText}>Didn't receive email? <Text style={styles.resendLink}>You can resend code in 55s</Text></Text>

      <Button title="Confirm" onPress={()=> navigation.navigate('Home')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 24,
    padding: 10,
    width: '20%',
  },
  resendText: {
    marginTop: 10,
    color: '#888',
  },
  resendLink: {
    color: '#2C1E57',
    textDecorationLine: 'underline',
  },
});

export default EmailVerificationScreen;
