import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';
import { ScrollView } from 'react-native-gesture-handler';

const SignInScreen = ({navigation}:any) => {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');


  const handleSignIn = () => {
    // Handle sign in action
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
        </TouchableOpacity>
        <Text style={styles.title}>Sign In</Text>
      </View>
      <View style={styles.container}>
       

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
          isPassword
        />

        <TouchableOpacity style={styles.resetButton} onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={styles.resetText}>Forgot your password? </Text>
        </TouchableOpacity>

        <Button title="Continue" onPress={() => navigation.navigate('2FA')} />

        <Text style={styles.faceIdText}>Login with Face ID</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF', // White background
    paddingTop: 60,
    paddingBottom: 30,
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

  faceIdText: {
    marginTop: 30,
    color: '#2C1E57',
    fontWeight: '600',
    fontFamily: 'urbanist',
  },
  //back arrow
  icon: { 
    width: 23.5,
    height: 20,
    marginHorizontal: 20,
    marginBottom: 18, // need these to be relative to screen size
    },
    //reset pass
    resetButton: {
      height: 40,
    },
    resetText: {
      fontSize: 14,
      marginTop: 10,
      color: '#888',
      fontWeight: '600',
      fontFamily: 'urbanist',
      textDecorationLine: 'underline',
    },
});

export default SignInScreen;
