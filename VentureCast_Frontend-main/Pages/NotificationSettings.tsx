
import React, {useState} from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
import LanguageButton from './Components/LanguageButton';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Profile: undefined; // Do this for all linked pages
};

// import { Ionicons } from '@expo/vector-icons'; // Icons used for the menu

const NotificationSettings = ( { }:any ) => {

  const [switchStates, setSwitchStates] = useState({
    positionUp10: false,
    positionDown10: false,
    topMarketMovers: false,
    newIPO: false,
    depositCompletion: false,
    withdrawCompletion: false,
    belowMaintenanceMargin: false,
    appUpdates: false,
    shortPositionLiquidated: false,
  });

  const toggleSwitch = (key: keyof typeof switchStates) => {
    setSwitchStates((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };
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

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Position is up 10%</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.positionUp10 ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('positionUp10')}
          value={switchStates.positionUp10} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Position is down 10%</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.positionDown10 ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('positionDown10')}
          value={switchStates.positionDown10} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Top Market Movers</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.topMarketMovers ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('topMarketMovers')}
          value={switchStates.topMarketMovers} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>New IPO</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.newIPO ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('newIPO')}
          value={switchStates.newIPO} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Deposit Completion</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.depositCompletion ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('depositCompletion')}
          value={switchStates.depositCompletion} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Withdraw Completion</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.withdrawCompletion ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('withdrawCompletion')}
          value={switchStates.withdrawCompletion} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Balance is Below Maintenance Margin</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.belowMaintenanceMargin ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('belowMaintenanceMargin')}
          value={switchStates.belowMaintenanceMargin} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>App Updates</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.appUpdates ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('appUpdates')}
          value={switchStates.appUpdates} />
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="moon-outline" size={24} color="#757575" /> */}
        <Text style={styles.menuText}>Short Position Liquidated</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#351560" }}
          thumbColor={switchStates.shortPositionLiquidated ? "#998fb7" : "#998fb7"}
          onValueChange={() => toggleSwitch('shortPositionLiquidated')}
          value={switchStates.shortPositionLiquidated} />
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
    paddingVertical: 15,
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

export default NotificationSettings;
