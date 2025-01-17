import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';
import { ScrollView } from 'react-native-gesture-handler';

const ResetPassword = ({navigation}:any) => {
  const [email, setEmail] = useState('');

// need an error function for no account email

  const handleSignIn = () => {
    // Handle sign in action
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        {/* Back icon here */}
        <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
      </TouchableOpacity>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>

        <InputField
          label="Email"
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
        />

        <InputField
          label="Confirm Email"
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
        />

        <Button title="Continue" onPress={() => navigation.navigate('ResetPassword2FA')} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF', // White background
    paddingVertical: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    fontFamily: 'urbanist',
  },
  resetText: {
    marginTop: 10,
    color: '#888',
    fontFamily: 'urbanist',
  },
  resetLink: {
    color: '#2C1E57',
    textDecorationLine: 'underline',
  },
  faceIdText: {
    marginTop: 30,
    color: '#2C1E57',
    fontWeight: '600',
    fontFamily: 'urbanist',
  },
  //back arrow
  icon: { 
    width: 28,
    height: 28,
    marginHorizontal: 20,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    },
    backButton: {
      height: 60,
      marginBottom: 30,
      paddingTop: 40,
    },
});

export default ResetPassword;
