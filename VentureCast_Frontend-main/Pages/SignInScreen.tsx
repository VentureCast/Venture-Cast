import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';

const SignInScreen = ({navigation}:any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    // Handle sign in action
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text>Please enter your email and password</Text>

      <InputField
        label="Email"
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
      />

      <InputField
        label="Password"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        isPassword
      />

      <Text style={styles.resetText}>Forgot Your Password? <Text style={styles.resetLink}>Reset Now</Text></Text>

      <Button title="Continue" onPress={() => navigation.navigate('SignInStep2')} />

      <Text style={styles.faceIdText}>Login Through Face ID</Text>
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
  resetText: {
    marginTop: 10,
    color: '#888',
  },
  resetLink: {
    color: '#2C1E57',
    textDecorationLine: 'underline',
  },
  faceIdText: {
    marginTop: 30,
    color: '#2C1E57',
    fontWeight: '600',
  },
});

export default SignInScreen;
