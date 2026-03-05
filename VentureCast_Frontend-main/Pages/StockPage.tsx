import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity} from 'react-native';
import MarketStat from './Components/MarketStat';
import LineGraph from './Components/LineGraph';
import MiniStockScroll from './Components/MiniStockScroll';
import ClipsElement from './Components/ClipsElement';
import ViewerPerShareGraph from './Components/ViewerPerShareGraph';
import NewsItem from './Components/NewsItem';
import StockItemHeader from './Components/StockItemHeader';
import { Button } from 'react-native-paper';
import formatCurrency from './Components/formatCurrency';
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native';
import { useUser } from '../UserProvider';
import api from '../services/api';

type RootStackParamList = {
  StockPage: { streamer_id: string };
  Portfolio: undefined;
  ClipsPage: undefined;
  BuyInter: { streamerId: string; stockName: string; stockLongName: string; stockCost: number };
  SellInter: { streamerId: string; stockName: string; stockLongName: string; stockCost: number; sharesOwned: number };
};

const StockDetail = ({ name, value, isPercent, image }: any) => {
  return (
      <View style={styles.accountDetail}>
        <Image source={image} style={styles.detailLogo} />
        <View style={styles.accountDetailContainer}>
          <Text style={styles.detailName}>{name}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
  );
};

// data for viewer graph
const viewerStats = [
  {id:'1', quarter: 'Q1', fiscalYear: 'FY24', valueOne: -0.22, valueTwo: -0.48, colorOne: '#F75555', colorTwo: '#C2B8CF', margin: 60},
  {id:'2', quarter: 'Q2', fiscalYear: 'FY24', valueOne: -0.24, valueTwo: -0.48, colorOne: '#12D18E', colorTwo: '#C2B8CF', margin: 60},
  {id:'3', quarter: 'Q3', fiscalYear: 'FY24', valueOne: +0.24, valueTwo: -0.20, colorOne: '#12D18E', colorTwo: '#C2B8CF', margin: 120},
  {id:'4', quarter: 'Q4', fiscalYear: 'FY24', valueOne: -0.65, valueTwo: -0.90, colorOne: '#F75555', colorTwo: '#C2B8CF', margin: 50},
  {id:'5', quarter: 'Q1', fiscalYear: 'FY25', valueOne: -0.85, valueTwo: -1.05, colorOne: '#F75555', colorTwo: '#C2B8CF', margin: 20},
];

const StockPage = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'StockPage'>>();
  const streamerId = route.params?.streamer_id;
  const { user, token } = useUser();

  const [streamer, setStreamer] = useState<any>(null);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [holding, setHolding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (user && token) {
      api.setToken(token);
      api.setUserId(user._id);
    }
  }, [user, token]);

  useEffect(() => {
    if (!streamerId || !user) {
      setError('No streamer or user selected.');
      setLoading(false);
      return;
    }
    setError(null);
    setTimeoutReached(false);
    const timeout = setTimeout(() => setTimeoutReached(true), 8000);
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch streamer info
        const streamerData = await api.getStreamer(streamerId);
        if (!streamerData) {
          setError('Streamer not found.');
          setLoading(false);
          clearTimeout(timeout);
          return;
        }
        setStreamer(streamerData);

        // Fetch share info
        try {
          const shareData = await api.getShareInfo(streamerId);
          setShareInfo(shareData);
        } catch {
          setShareInfo(null);
        }

        // Fetch user's holding for this streamer from portfolio
        try {
          const portfolioData = await api.getPortfolio(user._id);
          const userHolding = portfolioData.portfolio.find(
            (p: any) => p.streamer?._id === streamerId
          );
          setHolding(userHolding || null);
        } catch {
          setHolding(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data.');
      }
      setLoading(false);
      clearTimeout(timeout);
    };
    fetchData();
    return () => clearTimeout(timeout);
  }, [streamerId, user]);

  const price = shareInfo?.sharePrice || 0;
  const trendPercent = useMemo(() => {
    return '0.00'; // Price history not yet available from backend
  }, [price]);

  const sharesHeld = holding?.sharesOwned || 0;
  const purchasePrice = holding?.averageCost || 0;
  const holdingsValue = price * sharesHeld;
  const totalReturn = holdingsValue - (sharesHeld * purchasePrice);

  // Placeholder weekly trend data for the graph
  const weeklyTrendData = useMemo(() => {
    if (!price) return Array(8).fill(0);
    // Generate slight variations around current price for visual display
    return Array(8).fill(price).map((p, i) => p * (0.97 + Math.random() * 0.06));
  }, [price]);

  if (!streamerId || !user) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No streamer or user selected.</Text></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>;
  }
  if (timeoutReached) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Request timed out. Please try again.</Text></View>;
  }
  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
  }

  const marketStats = {
    currentPrice: price, changePercent: 0, change: 0, priceER: 0.5,
    sharesOutstanding: shareInfo?.totalShares || 0, viewPerShare: 1.43, yearHigh: price * 1.1, yearLow: price * 0.9,
  };

  const formatNumber = (number: number, decimals: number = 2): string => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatSimpleNumber = (number: number): string => {
    return number.toLocaleString('en-US');
  };

  const formatPercentage = (number: number, decimals: number = 2): string => {
    return `(${number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}%)`;
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.stockStats}>
          <StockItemHeader
            logo={require('../Assets/Images/dude-perfect.png')}
            name={streamer?.name || 'Streamer'}
            ticker={streamer?.ticker || ''}
            price={price}
            change={trendPercent}
            changePercent={trendPercent}
          />
        </View>
        {/* Weekly Trend Graph */}
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <LineGraph data={weeklyTrendData} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginTop: -20 }}>
            {[7,6,5,4,3,2,1,0].map((d, i) => (
              <Text key={i} style={{ color: '#fff', fontSize: 12 }}>{d}</Text>
            ))}
          </View>
        </View>

        {/* Buy/Sell buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('BuyInter', {
            streamerId,
            stockName: streamer?.ticker || '',
            stockLongName: streamer?.name || '',
            stockCost: price,
          })}>
            <View style={styles.buyButton}>
              <Text style={styles.buyButtonText}>Buy</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SellInter', {
            streamerId,
            stockName: streamer?.ticker || '',
            stockLongName: streamer?.name || '',
            stockCost: price,
            sharesOwned: sharesHeld,
          })}>
            <View style={styles.sellButton}>
              <Text style={styles.sellButtonText}>Sell</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* My Position section */}
        <View style={styles.stockSummary}>
          <Text style={styles.sectionTitle}>My Position</Text>
        </View>
        <View style={styles.accountGrid}>
          <StockDetail
            image={require('../Assets/Images/total-return.png')}
            name='Total Return'
            value={formatCurrency(totalReturn)}
            isPercent={false}
          />
          <StockDetail
            image={require('../Assets/Images/equity.png')}
            name='Holdings ($USD)'
            value={formatCurrency(holdingsValue)}
            isPercent={false}
          />
          <StockDetail
            image={require('../Assets/Icons/SharesHeld.png')}
            name='Shares Held'
            value={sharesHeld}
            isPercent={false}
          />
          <StockDetail
            image={require('../Assets/Icons/CostPerShare.png')}
            name='Purchase Price'
            value={formatCurrency(purchasePrice)}
            isPercent={false}
          />
        </View>

        {/* Market Stats Section */}
        <View style={styles.marketStats}>
          <Text style={styles.sectionTitle}>Market Statistics</Text>
        </View>
        <MarketStat
          title='Price-Earnings Ratio'
          description={formatNumber(marketStats.priceER)}
          icon={require('../Assets/Icons/Price-EarningsRatio.png')}
        />
        <MarketStat
          title='Shares Outstanding'
          description={formatSimpleNumber(marketStats.sharesOutstanding)}
          icon={require('../Assets/Icons/SharesOutstanding.png')}
        />
        <MarketStat
          title='Subscribers Per Share'
          description={formatNumber(marketStats.viewPerShare)}
          icon={require('../Assets/Icons/ViewPerShare.png')}
        />
        <MarketStat
          title='1 Year High'
          description={formatCurrency(marketStats.yearHigh)}
          icon={require('../Assets/Icons/YearHigh.png')}
        />
        <MarketStat
          title='1 Year Low'
          description={formatCurrency(marketStats.yearLow)}
          icon={require('../Assets/Icons/YearLow.png')}
        />

        {/* Experts Section */}
        <View style={styles.miniStockScroll}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>What the experts say</Text>
          </View>
          <Text style={styles.sectionSubTitle}>VentureCast Analyst Rating</Text>
          <View style={styles.expertsContainer}>
            <Image source={require('../Assets/Icons/BUY.png')} style={styles.bigBuy} />
            <View style={styles.dataColumn}>
              <View style={styles.graphContainer}>
                <View style={styles.emptyGraph}>
                  <View style={styles.buyGraph}></View>
                </View>
                <Text style={styles.buyText}>70%</Text>
                <Text style={styles.buyText}>Buy</Text>
              </View>
              <View style={styles.graphContainer}>
                <View style={styles.emptyGraph}>
                  <View style={styles.holdGraph}></View>
                </View>
                <Text style={styles.holdText}>25%</Text>
                <Text style={styles.holdText}>Hold</Text>
              </View>
              <View style={styles.graphContainer}>
                <View style={styles.emptyGraph}>
                  <View style={styles.sellGraph}></View>
                </View>
                <Text style={styles.sellText}>5%</Text>
                <Text style={styles.sellText}>Sell</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.accountGrid}>
          <StockDetail
            image={require('../Assets/Icons/TargetPrice.png')}
            name='Target Price'
            value={formatCurrency(price * 1.15)}
            isPercent={false}
          />
          <View style={styles.accountDetail}>
            <Image source={require('../Assets/Icons/EstimatedReturn.png')} style={styles.detailLogo} />
            <View style={styles.accountDetailContainer}>
              <Text style={styles.detailName}>Est. Return</Text>
              <Text style={[styles.detailValue, styles.positive]}>
                {formatPercentage(15.0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Viewers Per Share Section */}
        <View style={styles.marketStats}>
          <Text style={styles.sectionTitle}>Subscribers per share</Text>
        </View>
        <View>
          <View style={styles.viewerContainer}>
            {viewerStats.map(viewer => (
            <ViewerPerShareGraph
              key={viewer.id}
              quarter={viewer.quarter}
              fiscalYear={viewer.fiscalYear}
              valueOne={formatNumber(viewer.valueOne)}
              valueTwo={formatNumber(viewer.valueTwo)}
              colorOne={viewer.colorOne}
              colorTwo={viewer.colorTwo}
              margin={viewer.margin}
            />
              ))}
          </View>
        </View>
        <View style={styles.sectionBaseline}>
          <Text style={styles.sectionSubTitle}>The creator reported results on Febuary 25, 2025 and missed market expectations.</Text>
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
  stockSummary: {
    marginLeft: 20,
  },
  stockStats: {
    backgroundColor: '#351560',
    paddingHorizontal: 10,
  },
  backgroundImage: {
    height: 300,
    marginBottom: 10,
  },
  stockTitle: {
    fontFamily: 'Urbanist-Regular',
    fontSize: 40,
    fontWeight: 'bold',
  },
  stockSubTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLiveArrow: {
    height: 22,
    width: 22,
  },
  stockSubTitleText: {
    fontFamily: 'Urbanist-Regular',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  balanceBox: {
    width: 382,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  buyButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    paddingHorizontal: 70,
    borderRadius: 20,
    marginHorizontal: 5,
    borderColor: '#351560',
    borderWidth: 1,
  },
  sellButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    paddingHorizontal: 70,
    borderRadius: 20,
    marginHorizontal: 5,
    borderColor: '#351560',
    borderWidth: 1,
    },
  buyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    textAlign: 'center',
  },
  sellButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    textAlign: 'center',
  },
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingRight: 0,
    paddingLeft: 0,
    marginLeft: 8,
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
    justifyContent: 'space-between',
    padding: 10,
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
    marginTop: 8,
  },
  accountDetailContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 109,
    height: 53,
  },
  marketStats: {
    margin: 20,
  },
  stockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  miniStockScroll: {
    margin: 20,
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
  sectionSubTitle: {
    alignContent: 'flex-start',
    fontSize: 14,
    fontWeight: '300',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',
  },
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
  },
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
  expertsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  bigBuy: {
    marginRight: 20,
  },
  dataColumn: {
  },
  graphContainer: {
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyGraph: {
    backgroundColor: '#EEE',
    width:  160,
    height: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  buyGraph: {
    backgroundColor: '#351560',
    width: 112,
    height: 8,
    borderRadius: 20,
  },
  holdGraph: {
    backgroundColor: '#FFC107',
    width: 40,
    height: 8,
    borderRadius: 20,
  },
  sellGraph: {
    backgroundColor: '#F75555',
    width: 8,
    height: 8,
    borderRadius: 20,
  },
  buyText: {
    color:  '#351560',
    fontFamily: 'urbanist',
    fontSize: 12,
    marginHorizontal: 10,
  },
  holdText: {
    color:  '#FFC107',
    fontFamily: 'urbanist',
    fontSize: 12,
    marginHorizontal: 10,
  },
  sellText: {
    color:  '#F75555',
    fontFamily: 'urbanist',
    fontSize: 12,
    marginHorizontal: 10,
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
  },
  sectionBaseline: {
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingTop: 10,
  },
  clipsSubTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderColor: '#EAE7EF',
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
  showMoreButton: {
    justifyContent: 'center',
  },
});

export default StockPage;
