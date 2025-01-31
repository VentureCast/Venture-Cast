import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Profile: undefined; // Do this for all linked pages
  Portfolio: undefined;
  Notifications: undefined;
  Language: undefined;
  HelpCenter: undefined;
  About: undefined;
  WithdrawOption: undefined;
  DepositOption: undefined;
  ChangePassword: undefined;
  Activity: undefined;
  FundingActivity: undefined;
  VentureCast: undefined;
  PaymentMethods: undefined;
};
// import { Ionicons } from '@expo/vector-icons'; // Icons used for the menu

const acctData = [
  { id: '1', name: 'Cash', value: '23,087.39', change: 0.00, image: require('../Assets/Icons/BuyStock.png') },
  { id: '2', name: 'Daily Change', value: '9,739.36', change: 24.65, image: require('../Assets/Images/daily-change.png') },
  { id: '3', name: 'Equity', value: '186,473.68', change: 55.54, image: require('../Assets/Images/equity.png') },
  { id: '4', name: 'Total Return', value: '66,378.49', change: 24.65, image: require('../Assets/Images/total-return.png') }, //these images are not circles, or same dimensions: we need better ones
];

const AccountDetail = ({ name, value, changePercent, image }: any) => {
  return (
      <View style={styles.accountDetail}>
        <Image source={image} style={styles.detailLogo} />
        <View style={styles.accountDetailContainer}>
          <Text style={styles.detailName}>{name}</Text>
          <Text style={styles.detailValue}>${value}</Text>
          <Text style={[styles.stockChange, changePercent >= 0 ? styles.positive : styles.negative]}>
            ({changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`})
          </Text>
        </View>
      </View>
  );
};

const AccountScreen = () => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();



  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={require('../Assets/Images/JimmyBeast.png') } // Replace with actual profile image URL
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Alexander Creighton</Text>
          <Text style={styles.profileEmail}>acreighton01@joinventurecast.com</Text>
        </View>
        <TouchableOpacity>
          {/* <Ionicons name="pencil-outline" size={24} color="black" /> */}
        </TouchableOpacity>
      </View>
      <View style={styles.accountGrid}>
          {acctData.map(acct => (
            <AccountDetail
              key={acct.id}
              image={acct.image}
              name={acct.name}
              value={acct.value}
              changePercent={acct.change}
            />
          ))}
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
        <Text style={styles.menuText} onPress={() => navigation.navigate('Notifications')}>Notifications</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="time-outline" size={24} color="#673ab7" /> */}
        <Image source={require('../Assets/Icons/TransactionActivity.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('Activity')}>Trade History</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
      </View>

      <View style={styles.menuItem}>
        {/* <Ionicons name="bar-chart-outline" size={24} color="#43a047" /> */}
        <Image source={require('../Assets/Icons/FundingActivity.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('FundingActivity')}>Transaction Activity</Text>
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
        {/* <Ionicons name="cash-outline" size={24} color="#f44336" /> */}
        <Image source={require('../Assets/Icons/PaymentMethod.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('PaymentMethods')}>Payment Methods</Text>
        {/* <Ionicons name="chevron-forward-outline" size={24} color="black" /> */}
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
        <Text style={styles.menuText}  onPress={() => navigation.navigate('ChangePassword')}>Change Password</Text>
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
    fontFamily: 'Urbanist-Regular',
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
  // account money details
  accountGrid: {
    flex: 1,
    flexDirection: 'row', // Arrange items in rows
    flexWrap: 'wrap', // Wrap to the next row if needed
    alignItems: 'center', // Center items vertically
    justifyContent: 'space-between'
  },
  accountText: {
    fontSize: 16,
    color: '#6c757d',    
    fontFamily: 'Urbanist-Regular',
  },
  accountTextChange: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'Urbanist-Regular',
  },
  accountDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 11,
    paddingLeft: 0,
    width: '50%',
  },
  detailLogo: {
    width: 56, 
    height: 56,
    marginRight: 8,
  },
  detailName: {
    color:'#757575',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Urbanist-Regular',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '500',
  },
  accountDetailContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start', 
  },
  stockChange: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Urbanist-Regular',
    fontWeight: '600',
  },
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
  },

});

export default AccountScreen;
