import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import InputField from './Components/InputField';
import Button from './Components/Button';
import { supabase } from '../supabaseClient';
import { useNavigation } from '@react-navigation/native';

const SignInScreen = ({ navigation: navFromProps }: any) => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = navFromProps || useNavigation();

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const lowerEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({ email: lowerEmail, password });
      if (error) {
        setError(error.message);
      } else if (data && data.user) {
        navigation.navigate('Home');
      } else {
        setError('Unknown error.');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error.');
    } finally {
      setLoading(false);
    }
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
          label="Email"
          placeholder="Enter email"
          value={email}
          autoCapitalize="none"
          onChangeText={text => setEmail(text)}
        />
        <InputField
          label="Password"
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          isPassword
        />
        {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
        <TouchableOpacity style={styles.resetButton} onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={styles.resetText}>Forgot your password? </Text>
        </TouchableOpacity>
        <Button title={loading ? 'Signing in...' : 'Continue'} onPress={handleSignIn} disabled={loading} />
        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
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
