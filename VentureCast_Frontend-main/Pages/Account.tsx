import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../UserProvider';
import api from '../services/api';

type RootStackParamList = {
  Profile: undefined;
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

const AccountDetail = ({ name, value, changePercent, image }: any) => {
  return (
      <View style={styles.accountDetail}>
        <Image source={image} style={styles.detailLogo} />
        <View style={styles.accountDetailContainer}>
          <Text style={styles.detailName}>{name}</Text>
          <Text style={styles.detailValue}>${value}</Text>
          {changePercent !== undefined && changePercent !== null && changePercent !== 0 && (
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
  const { user, token, signOut } = useUser();
  const [portfolioData, setPortfolioData] = useState<any>(null);

  useEffect(() => {
    if (user && token) {
      api.setToken(token);
      api.setUserId(user._id);
    }
  }, [user, token]);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!user || !token) return;
      try {
        const data = await api.getPortfolio(user._id);
        setPortfolioData(data);
      } catch {
        setPortfolioData(null);
      }
    };
    fetchPortfolioData();
  }, [user, token]);

  const equityData = useMemo(() => {
    if (!portfolioData?.summary) {
      return { cash: 0, equity: 0, dailyChange: 0, trendPercentDay1: 0, trendPercentAvgCost: 0, totalReturn: 0 };
    }
    const summary = portfolioData.summary;
    return {
      cash: summary.cashBalance || 0,
      equity: summary.totalValue || 0,
      dailyChange: 0, // Day-over-day change not yet tracked
      trendPercentDay1: 0,
      trendPercentAvgCost: Number(summary.totalGainLossPercent || 0),
      totalReturn: summary.totalGainLoss || 0,
    };
  }, [portfolioData]);

  const acctData = [
    { id: '1', name: 'Cash', value: equityData.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: 0.00, image: require('../Assets/Icons/BuyStock.png') },
    { id: '3', name: 'Equity', value: equityData.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), image: require('../Assets/Images/equity.png') },
    { id: '2', name: 'Daily Change', value: equityData.dailyChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: equityData.trendPercentDay1, image: require('../Assets/Images/daily-change.png') },
    { id: '4', name: 'Total Return', value: equityData.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change: equityData.trendPercentAvgCost, image: require('../Assets/Images/total-return.png') },
  ];

  const handleLogout = async () => {
    await signOut();
    navigation.navigate('VentureCast');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={require('../Assets/Images/JimmyBeast.png') }
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity>
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
        <Image source={require('../Assets/Icons/ProfileColor.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('Profile')}>Personal Info</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/Notifications.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('Notifications')}>Notifications</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/TransactionActivity.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('Activity')}>Trade History</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/FundingActivity.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('FundingActivity')}>Transaction Activity</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/Deposit.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('DepositOption')}>Deposit to VentureCast</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/Withdraw.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('WithdrawOption')}>Withdraw from VentureCast</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/PaymentMethod.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('PaymentMethods')}>Payment Methods</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/Help.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('HelpCenter')}>Help</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/ChangePassword.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('ChangePassword')}>Change Password</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/About.png')} style={styles.menuIcon} />
        <Text style={styles.menuText} onPress={() => navigation.navigate('About')}>About Venture Cast</Text>
      </View>

      <View style={styles.menuItem}>
        <Image source={require('../Assets/Icons/LogOut.png')} style={styles.menuIcon} />
        <Text style={styles.logOut} onPress={handleLogout}>Log Out</Text>
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
  accountGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
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
