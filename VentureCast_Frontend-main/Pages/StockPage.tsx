import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity} from 'react-native';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import MarketStat from './Components/MarketStat';
import LineGraph from './Components/LineGraph';
import MiniStockScroll from './Components/MiniStockScroll';
import ClipsElement from './Components/ClipsElement';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  Portfolio: undefined;
  ClipsPage: undefined;
};
//import { Section } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';

//stock details : shares held, Cost per Share, Equity and Total return in a 2x2 grid 

const StockDetailCash = ({ name, value, changePercent, image }: any) => {
  return (
      <View style={styles.accountDetail}>
        <Image source={image} style={styles.detailLogo} />
        <View style={styles.accountDetailContainer}>
          <Text style={styles.detailName}>{name}</Text>
          <Text style={styles.detailValue}>${value}</Text>
        </View>
      </View>
  );
};
const StockDetailValue = ({ name, value, changePercent, image }: any) => {
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



// Portfolio screen starts

const StockPage = ({}:any) => {
  // Sample data for stock positions
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const acctStockDataCash = [
    { id: '2', name: 'Cost at Buy', value: 73.86, image: require('../Assets/Icons/CostPerShare.png') },
    { id: '3', name: 'Equity', value: '22,935.46' , image: require('../Assets/Images/equity.png') },
    { id: '4', name: 'Total Return', value: '1,946.75', image: require('../Assets/Images/total-return.png') }, //these images are not circles, or same dimensions: we need better ones
  ];
  const acctStockDataValue = [
  { id: '1', name: 'Shares Held', value: 284.17, image: require('../Assets/Icons/SharesHeld.png') },
  ];

  const stockLiveValue = { value: 80.71, changePercent: 9.27, change: 6.85 };


// do not know where the portfolio header is created or called, want it gone.
//also want the gray bar gone so that the logo and the name hover over the 
  return (
    <>
      <ScrollView style={styles.container}>

        {/* Line Graph */}
        <LineGraph background={require('../Assets/Images/DarkBackground.png')}/>

        {/* Stock Live value Section */}
        <View style={styles.balanceBox}>
            <Text style={styles.stockTitle}>$80.71</Text>
            <View style={styles.stockSubTitle} >
               {/* arrows and text color changes for positive and down for negative*/}
              <Image source=
                { stockLiveValue.changePercent >= 0 ? require('../Assets/Icons/Arrow-Up-Purple.png') : require('../Assets/Icons/Arrow-Down-Purple.png')} 
                style={styles.stockLiveArrow}
              />
              <Text style={[styles.stockSubTitleText, stockLiveValue.changePercent >= 0 ? styles.positive : styles.negative]}>
              ${stockLiveValue.change} ({stockLiveValue.changePercent}%)</Text>
              <Text style={styles.stockSubTitleText} >Last Close</Text>
            </View>
        </View>
          {/* my investment */}
        <View style={styles.stockSummary}>
          <Text style={styles.sectionTitle}>My Position</Text>
        </View>
        <View style={styles.accountGrid}>
          <View>
            {acctStockDataValue.map(value => (
              <StockDetailValue
                key={value.id}
                image={value.image}
                name={value.name}
                value={value.value}
              />
            ))}
          </View>
          <View>
            {acctStockDataCash.map(acct => (
              <StockDetailCash
                key={acct.id}
                image={acct.image}
                name={acct.name}
                value={acct.value}
              />
            ))}
          </View>
        </View>


          {/* Market Stats Section */}
        <View style={styles.marketStats}>
          <Text style={styles.sectionTitle}>Market Statistics</Text>
        </View>
        <MarketStat   
          title='Price-Earnings Ratio'
          description='N/A'
          icon={require('../Assets/Icons/Price-EarningsRatio.png')}
        />
        <MarketStat   
          title='Shares Outstanding'
          description='2,789,786'
          icon={require('../Assets/Icons/SharesOutstanding.png')}
        />
        <MarketStat   
          title='Viewers Per Share'
          description='1.43'
          icon={require('../Assets/Icons/ViewPerShare.png')}
        />
        <MarketStat   
          title='1 Year High'
          description='$85.45'
          icon={require('../Assets/Icons/YearHigh.png')}
        />
        <MarketStat   
          title='1 Year Low'
          description='$69.29'
          icon={require('../Assets/Icons/YearLow.png')}
        />
          {/* Experts Section */}
          {/* Viewers Per Share Section */}
          {/* News Section */}
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
          Views='543.32'
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
    paddingVertical: 10,
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
  },
  accountDetailContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start', 
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

});

export default StockPage;
