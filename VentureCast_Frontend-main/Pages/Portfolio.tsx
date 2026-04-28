import React, {useState, useEffect, useMemo} from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import Dropdown from './Components/Dropdown';
import StockItems from './Components/StockItems';
import formatCurrency from './Components/formatCurrency';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../UserProvider';
import api from '../services/api';

type RootStackParamList = {
  StockPage: { streamer_id: string };
  Portfolio: undefined;
  ClipsPage: undefined;
  short: undefined;
};

const AccountDetail = ({ name, value, changePercent, image }: any) => {
  return (
      <View style={styles.accountDetail}>
        <Image source={image} style={styles.detailLogo} />
        <View style={styles.accountDetailContainer}>
          <Text style={styles.detailName}>{name}</Text>
          <Text style={styles.detailValue}>{formatCurrency(value)}</Text>
          {changePercent !== undefined && changePercent !== null && changePercent !== 0 && (
            <Text style={[styles.stockChange, changePercent >= 0 ? styles.positive : styles.negative]}>
              ({changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`})
            </Text>
          )}
        </View>
      </View>
  );
};

const PortfolioScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, token } = useUser();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: '0',
    cashBalance: 0,
    totalAccountValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showMore1, setShowMore1] = useState(false);
  const [sortField1, setSortField1] = useState<string>('');
  const [sortDirection1, setSortDirection1] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (user && token) {
      api.setToken(token);
      api.setUserId(user._id);
      fetchPortfolio();
    }
  }, [user, token]);

  const fetchPortfolio = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const data = await api.getPortfolio(user._id);

      setPortfolioData(data.portfolio || []);
      setSummary(data.summary || {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: '0',
        cashBalance: 0,
        totalAccountValue: 0,
      });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setPortfolioData([]);
    } finally {
      setLoading(false);
    }
  };

  const dummyImage = require('../Assets/Images/dude-perfect.png');

  const stockData = useMemo(() => {
    return portfolioData.map((holding, index) => {
      const gainLossPercent = parseFloat(holding.gainLossPercent || '0');
      return {
        id: holding.streamer?._id || `holding-${index}`,
        streamer_id: holding.streamer?._id || '',
        name: holding.streamer?.name || 'Unknown',
        ticker: (holding.streamer?.name || 'UNK').substring(0, 4).toUpperCase(),
        price: holding.currentPrice || 0,
        change: gainLossPercent,
        sharesOwned: holding.sharesOwned || 0,
        averageCost: holding.averageCost || 0,
        currentValue: holding.currentValue || 0,
        logo: dummyImage,
      };
    });
  }, [portfolioData]);

  const equityData = useMemo(() => {
    const dailyChange = summary.totalGainLoss || 0;
    const dailyPercent = parseFloat(summary.totalGainLossPercent || '0');
    return {
      cash: summary.cashBalance || 0,
      equity: summary.totalValue || 0,
      dailyChange,
      trendPercent: dailyPercent,
      totalReturn: summary.totalGainLoss || 0,
      totalReturnPercent: dailyPercent,
    };
  }, [summary]);

  const acctData = [
    { id: '1', name: 'Cash', value: equityData.cash, change: 0, image: require('../Assets/Images/cash.png') },
    { id: '3', name: 'Equity', value: equityData.equity, image: require('../Assets/Images/equity.png') },
    { id: '2', name: 'Daily Change', value: equityData.dailyChange, change: equityData.trendPercent, image: require('../Assets/Images/daily-change.png') },
    { id: '4', name: 'Total Return', value: equityData.totalReturn, change: equityData.totalReturnPercent, image: require('../Assets/Images/total-return.png') },
  ];

  const handleShowMore1 = () => {
    setShowMore1((prev) => !prev);
  };

  const handleSort1 = (type: string) => {
    if (sortField1 === type) {
      setSortDirection1(sortDirection1 === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField1(type);
      setSortDirection1('asc');
    }
  };

  const sortedStockData = useMemo(() => {
    if (!sortField1) return stockData;

    const sorted = [...stockData].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField1) {
        case 'Price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'Name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'Percent':
          aValue = a.change;
          bValue = b.change;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection1 === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection1 === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [stockData, sortField1, sortDirection1]);

  const displayedPositions1 = showMore1 ? sortedStockData : sortedStockData.slice(0, 3);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#351560" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>

        <Image style={styles.backgroundImage} source={require('../Assets/Images/portfolio-background.png')} />

        {/* Account Summary Section */}
        <View style={styles.balanceBox}>
            <Text style={styles.balanceSubTitle}>Net Account Value</Text>
            <Text style={styles.balanceTitle}>{formatCurrency(equityData.cash + equityData.equity)}</Text>
        </View>
        <View style={styles.accountSummary}>
          <Text style={styles.sectionTitle}>My Account</Text>
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

        {/* Stock Positions */}
        <View style={styles.stockList}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>My Stock Positions</Text>
            <Dropdown
              dropOptions={['Price', 'Name', 'Percent']}
              filler='Sort By'
              onSelect={handleSort1}
            />
          </View>

          {displayedPositions1.length === 0 ? (
            <Text style={styles.emptyText}>No stock positions yet. Start trading!</Text>
          ) : (
            displayedPositions1.map((stock) => (
              <StockItems
                key={stock.id}
                logo={stock.logo}
                name={stock.name}
                ticker={stock.ticker}
                price={stock.price}
                change={stock.change}
                changePercent={stock.change}
                onPress={() => navigation.navigate('StockPage', { streamer_id: stock.streamer_id })}
              />
            ))
          )}

          {stockData.length > 3 && (
            <TouchableOpacity style={styles.button} onPress={handleShowMore1}>
              <Text style={styles.buttonText}>{showMore1 ? 'Show Less' : 'Show More'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    height: 350,
    marginBottom: 10,
  },
  accountSummary: {
    marginLeft: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'Urbanist-Regular',
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  buttonText: {
    color: '#351560',
    fontSize: 16,
    fontWeight: 'semibold',
    fontFamily: 'urbanist-Regular'
  },
  balanceBox: {
    backgroundColor: '#F5F3F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 35,
    borderColor: '#D3D3D3',
    borderWidth: 0.6,
  },
  balanceSubTitle: {
    fontSize: 14,
    fontWeight: 'semibold',
    fontFamily: 'Urbanist-Regular',
    paddingTop: 10,
  },
  balanceTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'Urbanist-Regular',
    paddingBottom: 10,
  },
  accountGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  accountDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 11,
    paddingLeft: 10,
    width: '50%',
  },
  detailLogo: {
    width: 60,
    height: 60,
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
  stockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockList: {
    marginLeft: 20,
    marginBottom: 20,
    marginRight: 20,
    marginTop: 20,
  },
  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',
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

export default PortfolioScreen;
