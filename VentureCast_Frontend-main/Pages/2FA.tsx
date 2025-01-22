import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Button from './Components/Button';

const TwoFA = ({navigation}:any) => {
  const [code, setCode] = useState(['', '', '', '']);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
  };

  // also need an error sequence

  const handleConfirm = () => {
    // Handle OTP confirmation
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
        </TouchableOpacity>
        <Text style={styles.title}>Two Factor Authentication</Text>
      </View>
      <View style={styles.container}>
    
        <Text style={styles.subTitle} >We have sent a code to your email. Check your email and enter the code below.</Text>


   {/* needs to prompt the apple/android numpads*/}

        <View style={styles.codeInputContainer}>
          {code.map((_, index) => (
            <TextInput
              key={index}
              style={styles.codeInput}
              value={code[index]}
              onChangeText={(text) => handleChange(text, index)}
              maxLength={1}
              keyboardType="numeric"
            />
          ))}
        </View>

        <Text style={styles.resendText}>Resend</Text>

        <Button title="Confirm" onPress={()=> navigation.navigate('Home')} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
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
    marginBottom: 10,
    fontFamily: 'urbanist',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 10,
    fontFamily: 'urbanist',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    textAlign: 'center',
    fontSize: 24,
    padding: 20,
    width: '20%',
  },
  resendText: {
    marginTop: 10,
    color: '#888',
    textDecorationLine: 'underline',
    fontFamily: 'urbanist',
  },
  resendLink: {
    color: '#2C1E57',
   
  },
    //back arrow
    icon: { 
      width: 23.5,
      height: 20,
      marginHorizontal: 20,
      marginBottom: 10,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      },
      backButton: {
        height: 60,
        marginBottom: 30,
        paddingTop: 40,
      },
});

export default TwoFA;
