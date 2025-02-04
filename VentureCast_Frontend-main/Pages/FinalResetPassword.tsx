import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';

const FinalResetPassword = ({navigation}:any) => {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

// need an error function for wrong pass/username

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
        <Text style={styles.title}>Sign In</Text>

        <InputField
          label="Username"
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
        />

        <InputField
          label="Password"
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
        />


        <TouchableOpacity style={styles.resetButton} onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={styles.resetText}>Forgot your password? </Text>
        </TouchableOpacity>

        <Button title="Continue" onPress={() => navigation.navigate('Home')} />
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

    //reset 
    resetButton: {
      height: 40,
    },
    resetText: {
      marginTop: 10,
      color: '#888',
      fontFamily: 'urbanist',
      textDecorationLine: 'underline',

    },
});

export default FinalResetPassword;
