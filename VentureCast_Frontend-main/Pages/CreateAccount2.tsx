import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from './Components/Button';
import InputField from './Components/InputField';

const CreateAccountScreen = ({navigation}:any) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [howDidYouHear, setHowDidYouHear] = useState('');

  const handleContinue = () => {
    // Handle continue action
  };

  return (
    <View style={styles.container}>
      <InputField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />

      <InputField
        label="User Name"
        value={username}
        onChangeText={setUsername}
        placeholder="User Name"
      />

      <InputField
        label="Set Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <InputField
        label="How Did You Hear About Us?"
        value={howDidYouHear}
        onChangeText={setHowDidYouHear}
        placeholder="e.g., YouTube"
      />

      <Button title="Continue" onPress={() => navigation.navigate('ScanScreen')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
});

export default CreateAccountScreen;
