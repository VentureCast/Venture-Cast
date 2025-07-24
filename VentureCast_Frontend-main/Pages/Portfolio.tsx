import React, {useState, useEffect, useMemo} from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import Dropdown from './Components/Dropdown'; // does not do anything but is visible
// import LineGraph from './Components/LineGraph';
import StockItems from './Components/StockItems';
import formatCurrency from './Components/formatCurrency';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../UserProvider';
import { supabase } from '../supabaseClient';

type RootStackParamList = {
  StockPage: { streamer_id: string };
  Portfolio: undefined;
  ClipsPage: undefined;
  short: undefined;
};

//Account details : cash, equity, daily change and such in a 2x2 grid 

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

// Reusable component for Line Graph (Placeholder for now)
// made a separate component LineGraph

// Portfolio screen starts

const PortfolioScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [streamerStats, setStreamerStats] = useState<any[]>([]);
  const [userCash, setUserCash] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showMore1, setShowMore1] = useState(false);
  const [showMore2, setShowMore2] = useState(false);
  const [sortField1, setSortField1] = useState<string>('');
  const [sortDirection1, setSortDirection1] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchHoldingsAndStreamers = async () => {
      if (!user) {
        return;
      }
      setLoading(true);
      
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
        setStreamers([]);
        setStreamerStats([]);
        setLoading(false);
        return;
      }
      setHoldings(holdingsData);
      
      // Get unique streamer_ids
      const streamerIds = [...new Set(holdingsData.map(h => h.streamer_id))];
      
      if (streamerIds.length === 0) {
        setStreamers([]);
        setStreamerStats([]);
        setLoading(false);
        return;
      }
      
      // Fetch all relevant streamers
      const { data: streamersData, error: streamersError } = await supabase
        .from('Streamers')
        .select('streamer_id, username, ticker_name')
        .in('streamer_id', streamerIds);
      
      if (streamersError || !streamersData) {
        setStreamers([]);
      } else {
        setStreamers(streamersData);
      }
      
      // Fetch streamer stats for current prices
      const { data: statsData, error: statsError } = await supabase
        .from('StreamerStats')
        .select('streamer_id, current_price, day_1_price')
        .in('streamer_id', streamerIds);
      
      if (statsError || !statsData) {
        setStreamerStats([]);
      } else {
        setStreamerStats(statsData);
      }
      
      setLoading(false);
    };
    fetchHoldingsAndStreamers();
  }, [user]);

  // Memoize streamerMap to prevent recreation on every render
  const streamerMap = useMemo(() => {
    return Object.fromEntries(streamers.map(s => [s.streamer_id, s]));
  }, [streamers]);

  // Memoize statsMap to prevent recreation on every render
  const statsMap = useMemo(() => {
    return Object.fromEntries(streamerStats.map(s => [s.streamer_id, s]));
  }, [streamerStats]);

  // Memoize stockData to prevent recreation on every render
  const stockData = useMemo(() => {
    return holdings.map(h => {
      const streamer = streamerMap[h.streamer_id] || {};
      const stats = statsMap[h.streamer_id] || {};
      const price = stats.current_price || 100.00;
      const day1Price = stats.day_1_price || 100.00;
      const name = streamer.username || h.streamer_id;
      const ticker = streamer.ticker_name || 'DUMMY';
      const trendPercent = Number(((price / day1Price) - 1) * 100).toFixed(2);
      return {
        id: h.portfolio_id,
        streamer_id: h.streamer_id,
        name: name,
        ticker: ticker,
        price: price,
        change: trendPercent,
        logo: require('../Assets/Images/dude-perfect.png'),
      };
    });
  }, [holdings, streamerMap, statsMap]);

  // Calculate real equity and trend values based on holdings
  const equityData = useMemo(() => {
    let totalCurrentValue = 0;
    let totalDay1Value = 0;
    let totalAverageCost = 0;
    holdings.forEach(h => {
      const stats = statsMap[h.streamer_id] || {};
      const currentPrice = stats.current_price || 100.00;
      const day1Price = stats.day_1_price || 100.00;
      const shares = h.shares_owned || 0;
      const averageCost = h.average_cost || 100.00;
      totalCurrentValue += currentPrice * shares;
      totalDay1Value += day1Price * shares;
      totalAverageCost += averageCost * shares;
    });
    const cash = userCash;
    const equity = totalCurrentValue;
    const trendPercentDay1 = totalDay1Value > 0 ? ((totalCurrentValue / totalDay1Value) - 1) * 100 : 0;
    const trendPercentAvgCost = totalAverageCost > 0 ? ((totalCurrentValue / totalAverageCost) - 1) * 100 : 0;
    const dailyChange = totalCurrentValue - totalDay1Value;
    const totalReturn = totalCurrentValue - totalAverageCost;
    return {
      cash,
      equity,
      dailyChange,
      trendPercentDay1: Number(trendPercentDay1.toFixed(2)),
      trendPercentAvgCost: Number(trendPercentAvgCost.toFixed(2)),
      totalReturn
    };
  }, [holdings, statsMap, userCash]);

  const acctData = [
    { id: '1', name: 'Cash', value: equityData.cash, change: 0.00, image: require('../Assets/Images/cash.png') },
    { id: '3', name: 'Equity', value: equityData.equity, image: require('../Assets/Images/equity.png') },
    { id: '2', name: 'Daily Change', value: equityData.dailyChange, change: equityData.trendPercentDay1, image: require('../Assets/Images/daily-change.png') },
    { id: '4', name: 'Total Return', value: equityData.totalReturn, change: equityData.trendPercentAvgCost, image: require('../Assets/Images/total-return.png') },
  ];

  // Calculate displayed positions directly
  const displayedPositions2 = showMore2 ? [
    { id: '1', name: 'Jimmy BeastMode', ticker: 'MBT', price: 82.50, change: 2.94, logo: require('../Assets/Images/JimmyBeast.png') },
    { id: '2', name: 'PewDiePie', ticker: 'PDP', price: 90.79, change: -2.16, logo: require('../Assets/Images/pewdiepie.png') },
    { id: '3', name: 'Jake Paul', ticker: 'JKPI', price: 207.47, change: 2.37, logo: require('../Assets/Images/jake-paul.png') },
    { id: '4', name: 'Dude Perfect', ticker: 'DUPT', price: 7.23, change: 5.89, logo: require('../Assets/Images/dude-perfect.png') },
  ] : [
    { id: '1', name: 'Jimmy BeastMode', ticker: 'MBT', price: 82.50, change: 2.94, logo: require('../Assets/Images/JimmyBeast.png') },
    { id: '2', name: 'PewDiePie', ticker: 'PDP', price: 90.79, change: -2.16, logo: require('../Assets/Images/pewdiepie.png') },
    { id: '3', name: 'Jake Paul', ticker: 'JKPI', price: 207.47, change: 2.37, logo: require('../Assets/Images/jake-paul.png') },
  ];

  const handleShowMore1 = () => {
    setShowMore1((prev) => !prev);
  };

  const handleShowMore2 = () => {
    setShowMore2((prev) => !prev);
  };

  const handleSort1 = (type: string) => {
    if (sortField1 === type) {
      // Toggle direction if same field is clicked again
      setSortDirection1(sortDirection1 === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to ascending
      setSortField1(type);
      setSortDirection1('asc');
    }
  };

  const handleSort2 = (type: string) => {
    // Similar logic for short positions when they're re-enabled
  };

  // Sort the stock data based on current sort field and direction
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

  // Update displayed positions to use sorted data
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

        {/* Line Graph */}
        {/* <LineGraph data={sampleData} background={require('../Assets/Images/portfolio-background.png')}/> */}
        <Image style={styles.backgroundImage} source={require('../Assets/Images/portfolio-background.png')} />

        {/* Account Summary Section */}
        <View style={styles.balanceBox}>
            <Text style={styles.balanceSubTitle}>Net Account Value</Text>
            <Text style={styles.balanceTitle}>{formatCurrency(equityData.cash + equityData.equity)}</Text>
        </View>
          {/* my acct, new section 2x2 */}
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

          {displayedPositions1.map((stock) => (
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
          } 
          
          {/* Show more button only when there are more than 3 items */}
          {stockData.length > 3 && (
            <TouchableOpacity style={styles.button} onPress={handleShowMore1}>
              <Text style={styles.buttonText}>{showMore1 ? 'Show Less' : 'Show More'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* short Positions - COMMENTED OUT FOR NOW */}
        {false && (
        <View style={styles.stockList}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>My Short Positions</Text>
            <Dropdown 
              dropOptions={['Price', 'Name', 'Percent']}
              filler='Sort By'
              onSelect={handleSort2}
            />
          </View>

            {displayedPositions2.map((short) => (
            <StockItems
              key={short.id}
              logo={short.logo}
              name={short.name}
              ticker={short.ticker}
              price={short.price}
              change={short.change}
              changePercent={short.change}
              onPress={() => navigation.navigate('short')} // Pass the stock data to the details screen, need to create a prop that actually does this
            />
            ))
          }

         {/* Show more button only when there are more than 3 items */}
          {displayedPositions2.length > 3 && (
            <TouchableOpacity style={styles.button} onPress={handleShowMore2}>
              <Text style={styles.buttonText}>{showMore2 ? 'Show Less' : 'Show More'}</Text>
            </TouchableOpacity>
          )}
        </View>
        )}
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

  //showmore button
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

  // the user balance

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

// user acct info section

  accountGrid: {
    flex: 1,
    flexDirection: 'row', // Arrange items in rows
    flexWrap: 'wrap', // Wrap to the next row if needed
    alignItems: 'center', // Center items vertically
    justifyContent: 'space-between',
    padding: 10,
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

// stock/short list section

  stockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockList: {
    marginLeft: 20,
    marginBottom: 20,
    marginRight: 20,
    marginTop:20,   
  },
  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',
    },

    //stock items
  stockNameLogo: {
    flexDirection: 'row',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  stockLogo: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  stockName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Urbanist-Regular',
  },
  stockTicker: {
    color: '#6c757d',
    fontFamily: 'Urbanist-Regular',
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '600',
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

  // recent clips 
  recentClips: {
    marginLeft: 20,
    marginBottom: 20,
    marginRight: 20,
  },
  clipStockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  clipItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 15,
  },
  clipImage: {
    width: 115,
    height:200,
    borderRadius: 12,
  },

  // section title format (with arrow)
  rightArrow: {
    justifyContent: 'flex-end',
  },
  recentClipsTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  // show more button
  showMoreButton: {
    justifyContent: 'center',
  }
});

export default PortfolioScreen;
