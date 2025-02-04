import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';

const ChangePassword = ({navigation}:any) => {
  const [password, setPassword] = useState('');

// need an error function for no account email

  const handleSignIn = () => {
    // Handle sign in action
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
      </View>
      <View style={styles.container}>

        <InputField
          label="Old Password"
          placeholder="Enter old password"
          value={password}
          onChangeText={setPassword} // want this to confirm the old password
        />

        <InputField
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChangeText={setPassword} // want this to be the new password
        />

        <InputField
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={password}  
          onChangeText={setPassword} // want this to confirm the new password
        />

        <Button title="Change Password" onPress={() => navigation.navigate('SettingsScreen')} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF', // White background
    paddingBottom: 30,
    paddingTop: 60,
  },
  header: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 23.5,
    height: 20,
    marginHorizontal: 20,
    marginBottom: 18, // need these to be relative to screen size
    },

});

export default ChangePassword;
