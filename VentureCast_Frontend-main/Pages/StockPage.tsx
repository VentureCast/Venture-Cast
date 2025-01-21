import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity} from 'react-native';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import MarketStat from './Components/MarketStat';
import LineGraph from './Components/LineGraph';
import MiniStockScroll from './Components/MiniStockScroll';
import ClipsElement from './Components/ClipsElement';
import ViewerPerShareGraph from './Components/ViewerPerShareGraph';
import NewsItem from './Components/NewsItem';
import { Button } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  Portfolio: undefined;
  ClipsPage: undefined;
};
//import { Section } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';

//stock details : shares held, Cost per Share, Equity and Total return in a 2x2 grid 


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

// Reusable component for Line Graph (Placeholder for now)
//moved to a component --> LineGraph

// data for viewer graph
const viewerStats = [
  {id:'1', quarter: 'Q1', fiscalYear: 'FY24', valueOne: -0.22, valueTwo: -0.48, colorOne: '#FFB9B9', colorTwo: '#F75555', margin: 60},
  {id:'2', quarter: 'Q2', fiscalYear: 'FY24', valueOne: -0.24, valueTwo: -0.48, colorOne: '#12D18E', colorTwo: '#C2B8CF', margin: 60},
  {id:'3', quarter: 'Q3', fiscalYear: 'FY24', valueOne: +0.24, valueTwo: -0.20, colorOne: '#12D18E', colorTwo: '#C2B8CF', margin: 120}, 
  {id:'4', quarter: 'Q4', fiscalYear: 'FY24', valueOne: -0.65, valueTwo: -0.90, colorOne: '#FFB9B9', colorTwo: '#F75555', margin: 50},
  {id:'5', quarter: 'Q1', fiscalYear: 'FY25', valueOne: -0.85, valueTwo: -1.05, colorOne: '#FFB9B9', colorTwo: '#F75555', margin: 20},
];

// Portfolio screen starts

const StockPage = ({}:any) => {
  // Sample data for stock positions
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const userHoldings = {totalReturn: 1946.75, equity: 22935.46 , costAtBuy: 73.86, shares: 284.17, targetPrice: 117.25, estimatedReturn: 65.20, };

  const marketStats = {
    currentPrice: 80.71, changePercent: 9.27, change: 6.85, priceER: 0.5, 
    sharesOutstanding: 2789786, viewPerShare: 1.43, yearHigh: 85.45, yearLow: 69.29, 
    
  };


  // use this from here on out because we want the data to be raw numbers, then transformed here.
  const formatNumber = (number: number, decimals: number = 2): string => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }); // Formats the number with commas
  };

  const formatCurrency = (number: number, decimals: number = 2): string => {
    return `$${number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`; // Adds $ and formats the number
  };
  const formatPercentage = (number: number, decimals: number = 2): string => {
    return `(${number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}%)`; // Adds ( %) and formats the number
  };


  return (
    <>
      <ScrollView style={styles.container}>

        {/* Line Graph */}
        <LineGraph background={require('../Assets/Images/DarkBackground.png')}/>

        {/* Stock Live value Section */}
        <View style={styles.balanceBox}>
            <Text style={styles.stockTitle}>{formatCurrency(marketStats.currentPrice)}</Text>
            <View style={styles.stockSubTitle} >
               {/* arrows and text color changes for positive and down for negative*/}
              <Image source=
                { marketStats.changePercent >= 0 ? require('../Assets/Icons/Arrow-Up-Purple.png') : require('../Assets/Icons/Arrow-Down-Purple.png')} 
                style={styles.stockLiveArrow}
              />
              <Text style={[styles.stockSubTitleText, marketStats.changePercent >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(marketStats.change)} {formatPercentage(marketStats.changePercent)}</Text>
              <Text style={styles.stockSubTitleText} >Last Close</Text>
            </View>
        </View>
          {/* My Position section */}
        <View style={styles.stockSummary}>
          <Text style={styles.sectionTitle}>My Position</Text>
        </View>
        <View style={styles.accountGrid}>
              <StockDetail
                image={require('../Assets/Icons/SharesHeld.png')}
                name={'Shares Held'}
                value={userHoldings.shares}
                isPercent = {false}
              />
              <StockDetail
                image={require('../Assets/Icons/CostPerShare.png')}
                name= 'Cost at Buy'
                value={formatCurrency(userHoldings.costAtBuy)}
                isPercent = {false}
              />
              <StockDetail
                image={require('../Assets/Images/equity.png')}
                name= 'Equity'
                value={formatCurrency(userHoldings.equity)}
                isPercent = {false}
              />
              <StockDetail
                image={ require('../Assets/Images/total-return.png')}
                name= 'Total Return'
                value={formatCurrency(userHoldings.totalReturn)}
                isPercent = {false}
              />
        </View>


          {/* Market Stats Section */}
        <View style={styles.marketStats}>
          <Text style={styles.sectionTitle}>Market Statistics</Text>
        </View>
        <MarketStat   
          title='Price-Earnings Ratio'
          description={marketStats.priceER}
          icon={require('../Assets/Icons/Price-EarningsRatio.png')}
        />
        <MarketStat   
          title='Shares Outstanding'
          description={formatNumber(marketStats.sharesOutstanding)} // format number function adds commas
          icon={require('../Assets/Icons/SharesOutstanding.png')}
        />
        <MarketStat   
          title='Viewers Per Share'
          description={marketStats.viewPerShare}
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
          <View  style={styles.expertsContainer}>
            <Image source={require('../Assets/Icons/BUY.png')} style={styles.bigBuy} />
            <View style={styles.dataColumn}>
              <View style={styles.graphContainer}>
                <View style = {styles.emptyGraph}>
                  <View style={styles.buyGraph}></View>
                </View>
                <Text style={styles.buyText}>70%</Text>
                <Text style={styles.buyText}>Buy</Text>
              </View>
              <View style={styles.graphContainer}>
                <View style = {styles.emptyGraph}>
                  <View style={styles.holdGraph}></View>
                </View>
                <Text style={styles.holdText}>25%</Text>
                <Text style={styles.holdText}>Hold</Text>
              </View>
              <View style={styles.graphContainer}>
                <View style = {styles.emptyGraph}>
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
            image={ require('../Assets/Icons/TargetPrice.png')}
            name= 'Target Price'
            value={formatCurrency(userHoldings.targetPrice)}
            isPercent = {false}
          />
          <View style={styles.accountDetail}>
            <Image source={require('../Assets/Icons/EstimatedReturn.png')} style={styles.detailLogo} />
            <View style={styles.accountDetailContainer}>
              <Text style={styles.detailName}>Est. Return</Text>
              <Text style={[styles.detailValue, userHoldings.estimatedReturn >= 0 ? styles.positive : styles.negative]}
              >{formatPercentage(userHoldings.estimatedReturn)}</Text>
            </View> 
          </View>
        </View>

          {/* Viewers Per Share Section */}
        <View style={styles.marketStats}>
          <Text style={styles.sectionTitle}>Viewers per share</Text>
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

        {/* News Section */}
        {/* are we going to link to a "news" page or the clips page???? */}
        <TouchableOpacity onPress={() => navigation.navigate('ClipsPage')}>
          <View style = {styles.clipsSubTitle}>
            <Text style={styles.sectionTitle}>News</Text>
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
          </View>
        </TouchableOpacity>
        <NewsItem
          time= "1 day ago"
          title= 'Forbes'
          headline='Twitch Roundup: PewDiePie Earnings, Katy Perry Earnings, Dude Perfect Earnings, And ...'
        />
        <NewsItem
          time= "2 days ago"
          title= 'Seeking Alpha'
          headline='Own The Poll Booths'
        />
        <NewsItem
          time= "2 days ago"
          title= 'The Motley Fool'
          headline='Kathie Wood Has Abandoned Dude Perfect -- Should You Follow Her Lead?'
        />
        <Button style={styles.showMoreButton}>Show More</Button>

  

        {/* Characteristics Section */}

        {/* Stock Positions */}
        <View style={styles.miniStockScroll}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>People also bought</Text>
          </View>
          <MiniStockScroll />
        </View>

        {/* Recent Viral Clips Section */}
     
        <ClipsElement 
          title= '#TrickShot'
          subTitle='Trending Hashtag'
          icon={require('../Assets/Icons/Play.png')}
          views='543.32'
        />
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

  // the user balance

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
    height: 96,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
    borderColor: '#EEEEEE',
    borderWidth: 0.2,
  },
// Stock Holdings info section

  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Wrap items to the next row
    justifyContent: 'space-between', // Even spacing between items
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
// market stats
  marketStats: {
    margin: 20,
  },
// People also bought section

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
    //stock items
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
  },

  // graph; yet to be completed


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

  // experts section

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
    //color: '#351560'
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

  // viewers per share
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

  //news section title
  clipsSubTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderColor: '#EAE7EF',
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },

  //news section
  // newsContainer: {
  // flexDirection: 'column'
  // },
  showMoreButton: {
    justifyContent: 'center',
  },
});

export default StockPage;
