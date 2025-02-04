import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';

// import { Ionicons } from '@expo/vector-icons';

const CreateAccount = ({ navigation }:any) => {
  const [firstName, setFirstName] = useState('Alexander');
  const [middleName, setMiddleName] = useState('Scott');
  const [lastName, setLastName] = useState('Creighton');
  const [dateOfBirth, setDateOfBirth] = useState('12/27/1995');
  const [address, setAddress] = useState('221B Baker Street, London');

  const handleContinue = () => {
    // Logic for continue button 
    //? button is separate component? -matt
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create an Account</Text>
      </View>
      <InputField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First Name"/>
      <InputField label="Middle Name" value={middleName} onChangeText={setMiddleName} placeholder="Middle Name"/>
      <InputField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last Name"/>
      <InputField label="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="MM/DD/YYYY" keyboardType="numeric" />
      <InputField label="Address" value={address} onChangeText={setAddress} placeholder="Address" />
      <Button title="Continue" onPress={() => navigation.navigate('CreateAccountStep2')} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF', // White background
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#111',
    fontFamily: 'urbanist',
  },
  inputContainer: {
    marginBottom: 20,
    borderRadius: 20,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
    fontFamily: 'urbanist',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    paddingVertical: 10,
    fontSize: 18,
    color: '#111',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIcon: {
    marginLeft: 10,
  },
  continueButton: {
    backgroundColor: '#5D2DFD',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
  // back arrow
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

export default CreateAccount;
