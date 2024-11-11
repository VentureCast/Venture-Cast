import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
// import { Icon } from 'react-native-elements';

const AboutVentureCastScreen = () => {
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
        {/* <Icon name="arrow-back" type="material" color="#333" size={28} /> */}
        <Text style={styles.headerTitle}>About Venture Cast</Text>
      </View>

      {/* Logo and Version Information */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../Assets/Images/Frame.png')} // Add your logo image link here
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
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
  },
});

export default AboutVentureCastScreen;
