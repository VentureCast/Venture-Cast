import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, Dimensions } from 'react-native';
import Header from './Components/Header';
import CategoryBox from './Components/CategoryBox';
import MiniStockCard from './Components/MiniStockCard';
import StockDetailsScreen from './StockDetails';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../UserProvider';
import api from '../services/api';

type RootStackParamList = {
  StockPage: undefined;
  Portfolio: undefined;
  ClipsPage: undefined;
  DepositOption: undefined;
  Discover: undefined;
  Watchlist: undefined;
};

const defaultPercentage = '2.50';
const defaultGraph = require('../Assets/Graphs/Positive-Graph-1.png');

const screenWidth = Dimensions.get('window').width;
const numVisible = 3;
const horizontalPadding = 20;
const boxHeight = 140;
const boxSpacing = 20;
const boxWidth = (screenWidth - horizontalPadding * 2 - boxSpacing * (numVisible - 1)) / numVisible;

const VentureCastHome = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, token } = useUser();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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

  const totalAccountValue = portfolioData?.summary?.totalAccountValue || 0;
  const costBasis = portfolioData?.summary?.totalCost || 0;
  const cashBalance = portfolioData?.summary?.cashBalance || 0;

  const trendPercent = useMemo(() => {
    const totalCostWithCash = costBasis + cashBalance;
    if (totalCostWithCash === 0) return '0.00';
    const trend = ((totalAccountValue / totalCostWithCash) - 1) * 100;
    return trend.toFixed(2);
  }, [totalAccountValue, costBasis, cashBalance]);

  const moneyChange = useMemo(() => {
    const diff = (portfolioData?.summary?.totalGainLoss) || 0;
    return diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [portfolioData]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const data = await api.getCategories();
        setCategories(data.categories || []);
      } catch {
        setCategories([]);
      }
      setCategoriesLoading(false);
    };
    fetchCategories();
  }, []);

  return (
  <>
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        key={user?._id || 'header'}
        moneyChange={moneyChange}
        balance={totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        percentChange={trendPercent}
      />

      {/* Categories Section */}
      <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
        <View style={styles.subTitle}>
              <Text style={styles.sectionTitle}>Categories</Text>
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
                key={category.id}
                style={{
                  width: boxWidth,
                  height: 100,
                  marginRight: idx === categories.length - 1 ? 0 : boxSpacing,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CategoryBox
                  name={category.name}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Watch List Section */}
        <View style={styles.subTitle}>
            <Text style={styles.sectionTitle}>Watchlist</Text>
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
        </View>
      </TouchableOpacity>

      <View>
        <View style={styles.sectionWatchlist}>
            <MiniStockCard type="watchlist" />
        </View>
      </View>

      {/* My Stocks Section */}
      <TouchableOpacity onPress={() => navigation.navigate('Portfolio')}>
        <View style={styles.subTitle}>
              <Text style={styles.sectionTitle}>My Positions</Text>
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
  sectionWatchlist: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
  },
  temp: {
    height: 50,
  }
});

export default VentureCastHome;
