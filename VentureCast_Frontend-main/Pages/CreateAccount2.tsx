import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, ScrollView } from 'react-native';
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
  // need to now link over to the ID verification part

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          {/* Back icon here */}
          <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
        </TouchableOpacity>

        <Text style={styles.headerText}>Create an account (cont.)</Text>


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
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          
        />
        {/* ^^^^secureTextEntry to hide text^^^ */}

        <InputField
          label="How Did You Hear About Us?"
          value={howDidYouHear}
          onChangeText={setHowDidYouHear}
          placeholder="e.g., YouTube"
        />

        <Button title="Continue" onPress={() => navigation.navigate('ScanScreen')} />
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
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // back arrow
  icon: { 
    width: 28,
    height: 28,
    marginRight: 20,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    },
    backButton: {
      height: 40,
      marginBottom: 30,
      paddingTop: 20,
    },
    // header
    headerText: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 40,
      color: '#111',
      fontFamily: 'urbanist',
    },
});

export default CreateAccountScreen;
