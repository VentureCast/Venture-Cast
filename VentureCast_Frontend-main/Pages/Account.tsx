import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../UserProvider';
import { supabase } from '../supabaseClient';

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

const AccountDetail = ({ name, value, changePercent, image }: any) => {
  return (
      <View style={styles.accountDetail}>
        <Image source={image} style={styles.detailLogo} />
        <View style={styles.accountDetailContainer}>
          <Text style={styles.detailName}>{name}</Text>
          <Text style={styles.detailValue}>${value}</Text>
          {changePercent !== 0 && (
            <Text style={[styles.stockChange, changePercent >= 0 ? styles.positive : styles.negative]}>
              ({changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`})
            </Text>
          )}
        </View>
      </View>
  );
};

const AccountScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [streamerStats, setStreamerStats] = useState<any[]>([]);
  const [userCash, setUserCash] = useState<number>(0);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!user) return;
      // Fetch user cash
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('cash')
        .eq('user_id', user.id)
        .single();
      if (!userError && userData) {
        setUserCash(userData.cash || 0);
      }
      // Fetch holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('Holdings')
        .select('*')
        .eq('user_id', user.id);
      if (holdingsError || !holdingsData) {
        setHoldings([]);
        setStreamerStats([]);
        return;
      }
      setHoldings(holdingsData);
      const streamerIds = [...new Set(holdingsData.map(h => h.streamer_id))];
      if (streamerIds.length === 0) {
        setStreamerStats([]);
        return;
      }
      // Fetch streamer stats
      const { data: statsData } = await supabase
        .from('StreamerStats')
        .select('streamer_id, current_price')
        .in('streamer_id', streamerIds);
      setStreamerStats(statsData || []);
    };
    fetchPortfolioData();
  }, [user]);

  const statsMap = useMemo(() => {
    return Object.fromEntries(streamerStats.map(s => [s.streamer_id, s]));
  }, [streamerStats]);

  // Calculate values
  const equityData = useMemo(() => {
    let totalCurrentValue = 0;
    let totalAverageCost = 0;
    holdings.forEach(h => {
      const stats = statsMap[h.streamer_id] || {};
      const currentPrice = stats.current_price || 100.00;
      const shares = h.shares_owned || 0;
      const averageCost = h.average_cost || 100.00;
      totalCurrentValue += currentPrice * shares;
      totalAverageCost += averageCost * shares;
    });
    const cash = userCash;
    const equity = totalCurrentValue;
    const trendPercent = totalAverageCost > 0 ? ((totalCurrentValue / totalAverageCost) - 1) * 100 : 0;
    const dailyChange = totalCurrentValue - totalAverageCost;
    return {
      cash,
      equity,
      dailyChange,
      trendPercent: Number(trendPercent.toFixed(2)),
      totalReturn: dailyChange
    };
  }, [holdings, statsMap, userCash]);

  const acctData = [
    { id: '1', name: 'Cash', value: equityData.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: 0.00, image: require('../Assets/Icons/BuyStock.png') },
    { id: '2', name: 'Daily Change', value: equityData.dailyChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: equityData.trendPercent, image: require('../Assets/Images/daily-change.png') },
    { id: '3', name: 'Equity', value: equityData.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: equityData.trendPercent, image: require('../Assets/Images/equity.png') },
    { id: '4', name: 'Total Return', value: equityData.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: equityData.trendPercent, image: require('../Assets/Images/total-return.png') },
  ];

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
