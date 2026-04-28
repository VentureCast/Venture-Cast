import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import Button from './Components/Button';
import InputField from './Components/InputField';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  CameraScreen: undefined; // Do this for all linked pages
};

const CreateAccountScreen = () => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [howDidYouHear, setHowDidYouHear] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleContinue = () => {
    const p = password.trim();
    const c = confirmPassword.trim();

    if (!p) {
      setPasswordError('Please enter a password.');
      return;
    }
    if (!c) {
      setPasswordError('Please confirm your password.');
      return;
    }
    if (p !== c) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordError('');
    navigation.navigate('CameraScreen');
  };
  // need to now link over to the ID verification part

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create an Account</Text>
      </View>


        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <InputField
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {/* Password */}

        <InputField
          label="Set Password"
          value={password}
          onChangeText={(t) => {
            setPasswordError('');
            setPassword(t);
          }}
          placeholder="Password"
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
        />
        <InputField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(t) => {
            setPasswordError('');
            setConfirmPassword(t);
          }}
          placeholder="Confirm password"
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
        />
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <InputField
          label="How Did You Hear About Us?"
          value={howDidYouHear}
          onChangeText={setHowDidYouHear}
          placeholder="e.g., YouTube"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button title="Continue" onPress={handleContinue} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF', // White background
    paddingVertical: 10,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
    // header
    backButtonText: {
      fontSize: 30,
      color: '#000',
      fontFamily: 'urbanist',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginLeft: 10,
      fontFamily: 'urbanist',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      marginTop: 60,
    },
    errorText: {
      color: '#F75555',
      fontFamily: 'urbanist',
      fontSize: 14,
      marginTop: 4,
      marginBottom: 4,
    },
});

export default CreateAccountScreen;
