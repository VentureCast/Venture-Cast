import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';
// import { Ionicons } from '@expo/vector-icons';

const CreateAccount = ({ navigation }:any) => {
  const [fullName, setFullName] = useState('Andrew Seinfeld');
  const [dateOfBirth, setDateOfBirth] = useState('12/27/1995');
  const [address, setAddress] = useState('1340 Beaver In California, USA');

  const handleContinue = () => {
    // Logic for continue button
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton}>
        {/* Back icon here */}
      </TouchableOpacity>
      <Text style={styles.headerText}>Create my account</Text>
      <InputField label="Full Legal Name" value={fullName} onChangeText={setFullName} placeholder="Full Legal Name" />
      <InputField label="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="MM/DD/YYYY" keyboardType="numeric" />
      <InputField label="Full Address" value={address} onChangeText={setAddress} placeholder="Full Address" />
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
  backButton: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#111',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateAccount;
