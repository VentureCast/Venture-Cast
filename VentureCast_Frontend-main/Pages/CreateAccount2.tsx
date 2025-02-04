import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, ScrollView, Alert } from 'react-native';
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

  const handleContinue = () => {
    if (password === confirmPassword)
      return (
        navigation.navigate('CameraScreen')
      ); 
    else 
      return (
        Alert.alert('Passwords do not match.')
      );
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
        />

        <InputField
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
        />
        {/* Password */}

        <InputField
          label="Set Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
        <InputField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Password"
          keyboardType='password'
        />
        {/* ^^^^secureTextEntry to hide text^^^ */}

        <InputField
          label="How Did You Hear About Us?"
          value={howDidYouHear}
          onChangeText={setHowDidYouHear}
          placeholder="e.g., YouTube"
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
});

export default CreateAccountScreen;
