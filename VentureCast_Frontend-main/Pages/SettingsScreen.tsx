
import React, {useState} from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
import StaticHeader from './Components/StaticHeader';
import LanguageButton from './Components/LanguageButton';
import LanguageSelectionScreen from './Account/Language';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Profile: undefined; // Do this for all linked pages
  Notifications: undefined;
  HelpCenter: undefined;
  ChangePassword: undefined;
  About: undefined;
};

// import { Ionicons } from '@expo/vector-icons'; // Icons used for the menu

const SettingsScreen = ( { }:any ) => {

  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();



  return (
    <>

    <ScrollView style={styles.container}>
        {/* settings Header */}
      <View style={styles.titleRow}>
          <View style={styles.titleRowLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
            </TouchableOpacity>
          </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItem}>
        {/* <Ionicons name="person-outline" size={24} color="#ffab00" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('Profile')}>Personal Info</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="notifications-outline" size={24} color="#ff3d00" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('Notifications')}>Notifications</Text>
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
        <Text style={styles.menuText} onPress={() => navigation.navigate('HelpCenter')}>Funding Activity</Text>
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
          <LanguageButton />
          <Text style={styles.languageOption}>English (US)</Text>
        </View>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Dark Mode</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={isEnabled ? "#998fb7" : "#998fb7"}
          onValueChange={toggleSwitch}
          value={isEnabled} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="help-circle-outline" size={24} color="#6200ea" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('HelpCenter')}>Help</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="lock-closed-outline" size={24} color="#795548" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('ChangePassword')}>Change Password</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="information-circle-outline" size={24} color="#2196f3" /> */}
        <Text style={styles.menuText} onPress={() => navigation.navigate('About')}>About Venture Cast</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="log-out-outline" size={24} color="#d32f2f" /> */}
        <Text style={styles.logOut}>Log Out</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>
    </ScrollView>
    </>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    fontFamily: 'urbanist',
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
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    fontFamily: 'urbanist',
    color: '#351560',
    fontWeight: 'bold',
  },


  tempBlock: {
    height: 60,
    width: '100%',
    backgroundColor: '#351560',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Urbanist',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      marginTop: 20,
      justifyContent: 'space-between',
    },
    titleRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
  icon: { 
    width: 28,
    height: 28,
    marginRight: 20,
    },
});

export default SettingsScreen;
