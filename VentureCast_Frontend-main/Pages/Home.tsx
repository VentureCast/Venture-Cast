import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, Dimensions } from 'react-native';
import Header from './Components/Header';
import CategoryBox from './Components/CategoryBox';
import MiniWatchlist from './Components/MiniWatchlist';
import StockDetailsScreen from './StockDetails';
import MiniStockScroll from './Components/MiniStockScroll';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserProvider';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  Portfolio: undefined;
  ClipsPage: undefined;
  DepositOption: undefined;
  Discover: undefined;
};

const screenWidth = Dimensions.get('window').width;
const numVisible = 3;
const horizontalPadding = 20; // total horizontal padding (10 left, 10 right)
const boxHeight = 140; // Adjust as needed for shadow and content
const boxSpacing = 20; // Increased space between boxes
const boxWidth = (screenWidth - horizontalPadding * 2 - boxSpacing * (numVisible - 1)) / numVisible;

const VentureCastHome = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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

  // Calculate total account value (cash + equity)
  const totalAccountValue = useMemo(() => {
    let totalCurrentValue = 0;
    holdings.forEach(h => {
      const stats = statsMap[h.streamer_id] || {};
      const currentPrice = stats.current_price || 100.00;
      const shares = h.shares_owned || 0;
      totalCurrentValue += currentPrice * shares;
    });
    return userCash + totalCurrentValue;
  }, [holdings, statsMap, userCash]);

  // Calculate cost basis (cash + sum of average_cost * shares_owned)
  const costBasis = useMemo(() => {
    let totalCost = 0;
    holdings.forEach(h => {
      const shares = h.shares_owned || 0;
      const averageCost = h.average_cost || 100.00;
      totalCost += averageCost * shares;
    });
    return userCash + totalCost;
  }, [holdings, userCash]);

  // Calculate trend percent
  const trendPercent = useMemo(() => {
    if (costBasis === 0) return '0.00';
    const trend = ((totalAccountValue / costBasis) - 1) * 100;
    return trend.toFixed(2);
  }, [totalAccountValue, costBasis]);

  // Calculate money change (current account value - cost basis)
  const moneyChange = useMemo(() => {
    const diff = totalAccountValue - costBasis;
    return diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [totalAccountValue, costBasis]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      const { data, error } = await supabase
        .from('Categories')
        .select('category_id, name');
      console.log('Fetched categories:', data, 'Error:', error); // Debug output
      if (error) {
        setCategories([]);
      } else {
        setCategories(data || []);
      }
      setCategoriesLoading(false);
    };
    fetchCategories();
  }, []);

  return (
  <>
   {/* balance and header also need to be imported data from user database*/}
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        key={user?.id || 'header'}
        moneyChange={moneyChange}
        balance={totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        percentChange={trendPercent}
      />
      
      {/* Categories Section  graphs need to become functions of change of price(fund) over time*/}
      <TouchableOpacity onPress={() => navigation.navigate('Discover')}> 
        <View style = {styles.subTitle}>
              <Text style={styles.sectionTitle}>Categories</Text>
          {/* need this to be a button that opens up more clips */}
              <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
          </View>
      </TouchableOpacity>
      {categoriesLoading ? (
        <View style={{ padding: 20 }}>
          <Text>Loading categories...</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 10 }}
          contentContainerStyle={{ paddingLeft: horizontalPadding, paddingRight: horizontalPadding }}
        >
          <View style={styles.categoriesContainer}>
            {categories.map((category, idx) => (
              <View
                key={category.category_id}
                style={{
                  width: boxWidth,
                  height: boxHeight,
                  marginRight: idx === categories.length - 1 ? 0 : boxSpacing,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CategoryBox
                  graph={require('../Assets/Graphs/Positive-Graph-1.png')}
                  name={category.name}
                  percentage={'2.50'}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Watch List Section */}
      
        <View style = {styles.subTitle}>
            <Text style={styles.sectionTitle}>Watchlist</Text>
         {/* need this to be a button that opens up more clips */}
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
        </View>

      <View>
        <View style={styles.sectionWatchlist}>
            <MiniWatchlist />
        </View>
      </View>

      {/* My Stocks Section */}
      <TouchableOpacity onPress={() => navigation.navigate('Portfolio')}> 
        <View style = {styles.subTitle}>
              <Text style={styles.sectionTitle}>My Positions</Text>
          {/* need this to be a button that opens up more clips */}
              <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
        </View>
      </TouchableOpacity>
      <View style={styles.sectionWatchlist}>     
        <MiniStockScroll />
      </View>
    </ScrollView>
  </>
  );
};


// notes for second session:
// the deposit funds button to the header component
//

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',
    },

// static header
miniLogo: {
  width: 20, 
  height: 20,
  marginHorizontal: 5,
},
iconsHeaderContainer: {
  flexDirection: 'row',
},
miniTitleContainer: {
  flexDirection: 'row',
},
miniTitle: {
  fontSize: 20,
  marginLeft: 10,
  fontFamily: 'Urbanist-Regular',
  fontWeight: '900',
  color: 'white',
},
miniHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  height: 44,
  padding: 10,
  paddingLeft: 20, 
  backgroundColor: '#351560'
},
  //  SubTitles

  subTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginHorizontal: 20,
  },
  rightArrow: {
    justifyContent: 'flex-end',
  },
  clipsSubTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderColor: '#EAE7EF',
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },

  //Watchlist section

  sectionWatchlist: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
  },
  // idek what is going on, jk i do
  temp: {
    height: 50,
  } 
});

export default VentureCastHome;
