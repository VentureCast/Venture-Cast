import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';

const EnterEmailScreen = ({navigation}:any) => {
  const [email, setEmail] = useState('');

  const handleContinue = () => {
    // Handle email entry and move to verification step
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Account Email</Text>
      <Text>Please enter your account email address. We will send an OTP code for verification in the next step.</Text>

      <InputField
        label="Email"
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
      />

      <Button title="Continue" onPress={() => navigation.navigate('SignInStep3')} />
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
});

export default EnterEmailScreen;
