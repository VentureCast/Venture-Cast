// screens/VentureCast.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Vector Icons
import image from '../Assets/Images/Login.png';

const VentureCast = ({ navigation }:any) => {
  return (
    <ScrollView>
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={image} style={styles.logo} />
        </View>

        {/* Title and Subtitle */}
        <Text style={styles.title}>Welcome to VentureCast app</Text>
        <Text style={styles.subtitle}>
          The best app to invest in content creators with as little as $1.00
        </Text>

        {/* Authentication buttons */}
        <TouchableOpacity style={styles.authButton}>
          <Icon name="logo-google" size={30} color="#4F8EF7" />
          <Text style={styles.authButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.authButton}>
          <Text style={styles.authButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Sign up and Sign in buttons */}
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text style={styles.signUpText}>Sign up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 365,
    height: 290,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
  },
  authButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  signUpButton: {
    backgroundColor: '#5D2DFD',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInButton: {
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  signInText: {
    color: '#5D2DFD',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VentureCast;
