import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
};

// import { Icon } from 'react-native-elements';

const AboutVentureCastScreen = ({ }:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const menuItems = [
    'Partner',
    'Tax Form',
    'Privacy Policy',
    'Accessibility',
    'Feedback',
    'Rate us',
    'Visit Our Website',
    'Follow us on Social Media',
    'Patch Notes',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Venture Cast</Text>
      </View>

      {/* Logo and Version Information */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../Assets/Images/FramePurple.png')} // Add your logo image link here
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>VentureCast v5.6.9</Text>
      </View>

      {/* Menu Items */}
      {menuItems.map((item, index) => (
        <TouchableOpacity key={index} style={styles.menuItem}>
          <Text style={styles.menuText}>{item}</Text>
          {/* <Icon name="chevron-right" type="material" color="#333" /> */}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'urbanist',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100, // Adjust size as needed
    height: 100,
    opacity: 0.1, // Faded logo in the background
  },
  versionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    fontFamily: 'urbanist',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'urbanist',
  },
  icon: { 
    width: 28,
    height: 28,
    marginRight: 20,
    },
});

export default AboutVentureCastScreen;
