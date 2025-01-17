// screens/VentureCast.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Vector Icons


const VentureCast = ({ navigation }:any) => {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../Assets/Images/Login.png')} style={styles.logo} />
        </View>

        {/* Title and Subtitle */}
        <Text style={styles.title}>Welcome to VentureCast</Text>
        <Text style={styles.subtitle}>
          The best app to invest in content creators with as little as $1.00
        </Text>

        {/* Authentication buttons need to link to actual google and apple logins */}
        <TouchableOpacity style={styles.authButton}>
          <Image source={require('../Assets/Images/google.png')} style={styles.authLogo} />
          <Text style={styles.authButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.authButton}>
          <Image source={require('../Assets/Images/apple.png')} style={styles.authLogo} />
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
  scrollContainer: {
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 70,
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
    color: '#351560',
    marginBottom: 10,
    fontFamily: 'urbanist',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'urbanist',
    fontWeight: '400',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
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
  authLogo: {
    width: 20,
    height: 20,
  },
  signUpButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 20,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  signUpText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
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
    color: '#351560',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
});

export default VentureCast;
