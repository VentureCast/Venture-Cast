
import React, {useState} from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
import LanguageButton from './Components/LanguageButton';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Profile: undefined; // Do this for all linked pages
  NotificationSettings: undefined;
  HelpCenter: undefined;
  ChangePassword: undefined;
  About: undefined;
  DepositOption: undefined;
  WithdrawOption: undefined;
  Activity: undefined;
  FundingActivity: undefined;
  VentureCast: undefined;
};

// import { Ionicons } from '@expo/vector-icons'; // Icons used for the menu

const SettingsScreen = ( { }:any ) => {

  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();



  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* settings Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Back</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItem}>
        {/* <Ionicons name="person-outline" size={24} color="#ffab00" /> */}
        <Image source={require('../Assets/Icons/ProfileColor.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('Profile')}>Personal Info</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="notifications-outline" size={24} color="#ff3d00" /> */}
        <Image source={require('../Assets/Icons/Notifications.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('NotificationSettings')}>Notifications</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="time-outline" size={24} color="#673ab7" /> */}
        <Image source={require('../Assets/Icons/TransactionActivity.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('Activity')}>Transaction History</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="bar-chart-outline" size={24} color="#43a047" /> */}
        <Image source={require('../Assets/Icons/FundingActivity.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('FundingActivity')}>Funding Activity</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="card-outline" size={24} color="#ff9100" /> */}
        <Image source={require('../Assets/Icons/Deposit.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('DepositOption')}>Deposit to VentureCast</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="cash-outline" size={24} color="#f44336" /> */}
        <Image source={require('../Assets/Icons/Withdraw.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('WithdrawOption')}>Withdraw from VentureCast</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="language-outline" size={24} color="#1e88e5" /> */}
        <Image source={require('../Assets/Icons/Language.png')} style={styles.menuIcon} />
        <View style={styles.menuLanguageContainer}>
          <LanguageButton />
          <Text style={styles.languageOption}>English (US)</Text>
        </View>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Image source={require('../Assets/Icons/DarkMode.png')} style={styles.menuIcon} />
        <Text style={styles.menuText}>Dark Mode</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={isEnabled ? "#998fb7" : "#998fb7"}
          onValueChange={toggleSwitch}
          value={isEnabled} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="help-circle-outline" size={24} color="#6200ea" /> */}
        <Image source={require('../Assets/Icons/Help.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('HelpCenter')}>Help</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="lock-closed-outline" size={24} color="#795548" /> */}
        <Image source={require('../Assets/Icons/ChangePassword.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('ChangePassword')}>Change Password</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="information-circle-outline" size={24} color="#2196f3" /> */}
        <Image source={require('../Assets/Icons/About.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('About')}>About Venture Cast</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="log-out-outline" size={24} color="#d32f2f" /> */}
        <Image source={require('../Assets/Icons/LogOut.png')} style={styles.menuIcon} />
        <Text style={styles.logOut} onPress={() => navigation.navigate('VentureCast')}>Log Out</Text>
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
    paddingTop: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 18,
    flex: 1,
    marginLeft: 10,
    fontWeight: '600',
    fontFamily: 'urbanist',
  },
  menuIcon: {
    width: 52,
    height: 52,
  },
  menuLanguageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  languageOption: {
    color: '#6c757d',
    fontFamily: 'urbanist'
  },
  logOut: {
    fontSize: 18,
    flex: 1,
    marginLeft: 10,
    fontFamily: 'urbanist',
    color: '#351560',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButton: {
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
});

export default SettingsScreen;
