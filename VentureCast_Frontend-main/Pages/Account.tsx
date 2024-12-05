import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons'; // Icons used for the menu

const AccountScreen = ({navigation}:any) => {
  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/women/57.jpg' }} // Replace with actual profile image URL
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Andrew Ainsley</Text>
          <Text style={styles.profileEmail}>andrew_ainsley@yourdomain.com</Text>
        </View>
        <TouchableOpacity>
          {/* <Ionicons name="pencil-outline" size={24} color="black" /> */}
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItem}>
        {/* <Ionicons name="person-outline" size={24} color="#ffab00" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('Profile')}>Personal Info</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="notifications-outline" size={24} color="#ff3d00" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('NotiControl')}>Notifications</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="time-outline" size={24} color="#673ab7" /> */}
        <Text style={styles.menuText}>Transaction History</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="card-outline" size={24} color="#ff9100" /> */}
        <Text style={styles.menuText}>Deposit to VentureCast</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="bar-chart-outline" size={24} color="#43a047" /> */}
        <Text style={styles.menuText}>Funding Activity</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="cash-outline" size={24} color="#f44336" /> */}
        <Text style={styles.menuText}>Withdraw from VentureCast</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="language-outline" size={24} color="#1e88e5" /> */}
        <View style={styles.menuLanguageContainer}>
          <Text style={styles.menuText} onPress={() => navigation.navigate('Language')}>Language</Text>
          <Text style={styles.languageOption}>English (US)</Text>
        </View>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Dark Mode</Text>
        <Switch value={false} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="help-circle-outline" size={24} color="#6200ea" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('HelpCenter')}>Help</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="lock-closed-outline" size={24} color="#795548" /> */}
        <Text style={styles.menuText}>Change Password</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="document-text-outline" size={24} color="#8d6e63" /> */}
        <Text style={styles.menuText}>Legal Agreements</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="information-circle-outline" size={24} color="#2196f3" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('About')}>About Venture Cast</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="log-out-outline" size={24} color="#d32f2f" /> */}
        <Text style={styles.menuText}>Log Out</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#6c757d',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
  },
  menuLanguageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  languageOption: {
    color: '#6c757d',
  },
});

export default AccountScreen;
