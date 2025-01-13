import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import NotificationSettings from './Account/NotificationControl';
import AboutVentureCastScreen from './Account/About';
import LanguageSelectionScreen from './Account/Language';
import HelpCenter from './Account/HelpCenter';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import { Button } from 'react-native-paper';
import Dropdown from './Components/Dropdown'; // does not do anything but is visible

//import { Section } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';

// Reusable component for Stock Item
const StockItem = ({ logo, name, ticker, price, change, changePercent, onPress }: any) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.stockItem}>
        <View style={styles.stockNameLogo}> 
          <Image source={logo} style={styles.stockLogo} />
          <View>
            <Text style={styles.stockName}>{name}</Text>
            <Text style={styles.stockTicker}>{ticker}</Text>
          </View>
        </View>
          <View style={styles.stockPriceContainer}>
            <Text style={styles.stockPrice}>${price}</Text>
            <Text style={[styles.stockChange, change >= 0 ? styles.positive : styles.negative]}>
              {change >= 0 ? `+${changePercent}%` : `${changePercent}%`}
            </Text>
          </View>
      </View>
    </TouchableOpacity>
  );
};

//Account details : cash, equity, daily change and such in a 2x2 grid 

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

// Reusable component for Line Graph (Placeholder for now)
const LineGraph = ({ color }: any) => (
  <ImageBackground source={require('../Assets/Images/portfolio-background.png')}>
  <View style={[styles.lineGraph, { borderColor: color }]}>
    {/* You can implement a real graph using react-native-svg or similar libraries */}
    <Text style={{ color }}>Graph</Text>
  </View>
  </ImageBackground>
);

const PortfolioScreen = ({ navigation }: any) => {
  // Sample data for stock positions
  const stockData = [
    { id: '1', name: 'Dude Perfect', ticker: 'DUPT', price: '71.05', change: 2.94, logo: require('../Assets/Images/dude-perfect.png') },
    { id: '2', name: 'PewDiePie', ticker: 'PDP', price: '90.79', change: -2.16, logo: require('../Assets/Images/pewdiepie.png') },
    { id: '3', name: 'Jake Paul', ticker: 'JKPI', price: '207.47', change: 2.37, logo: require('../Assets/Images/jake-paul.png') },
  ];

  const shortData = [
    { id: '1', name: 'Dude Perfect', ticker: 'DUPT', price: '7.23', change: 5.89, logo: require('../Assets/Images/dude-perfect.png') },
    { id: '2', name: 'PewDiePie', ticker: 'PDP', price: '19.90', change: 7.60, logo: require('../Assets/Images/pewdiepie.png') },
    { id: '3', name: 'Jake Paul', ticker: 'JKPI', price: '26.87', change: -10.37, logo: require('../Assets/Images/jake-paul.png') },
  ];

  const acctData = [
    { id: '1', name: 'Cash', value: '23,087.39', change: 0.00, image: require('../Assets/Images/cash.png') },
    { id: '2', name: 'Daily Change', value: '9,739.36', change: 24.65, image: require('../Assets/Images/daily-change.png') },
    { id: '3', name: 'Equity', value: '186,473.68', change: 55.54, image: require('../Assets/Images/equity.png') },
    { id: '4', name: 'Total Return', value: '66,378.49', change: 24.65, image: require('../Assets/Images/total-return.png') }, //these images are not circles, or same dimensions: we need better ones
  ];

  // Function to handle stock item press
  const goToStockDetails = (stock: any) => {
    navigation.navigate('StockDetails', { stock });
  };
// do not know where the portfolio header is created or called, want it gone.
//also want the gray bar gone so that the logo and the name hover over the 
  return (
    <>
      <View style={styles.miniHeader}>
        <Image source={require('../Assets/Images/Frame.png')} style={styles.miniLogo}></Image>
        <Text style={styles.miniTitle}>VENTURECAST</Text> 
        {/* need to link this to the home page */}
      </View>
      <ScrollView style={styles.container}>

        {/* Line Graph */}
        <LineGraph color="green" />

        {/* Account Summary Section */}
        <View style={styles.balanceBox}>
            <Text style={styles.balanceTitle}>$229,375.25</Text>
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
        
       {/* session 3 agenda: 

       - stock section type (short or buy)
       - fonts
       - clips section
       - show more buttons
       - 
       
       */}



        {/* Stock Positions */}
        <View style={styles.stockList}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>My Stock Positions</Text>
            <Dropdown 

            />
          </View>
          {stockData.map(stock => (
            <StockItem
              key={stock.id}
              logo={stock.logo}
              name={stock.name}
              ticker={stock.ticker}
              price={stock.price}
              change={stock.change}
              changePercent={stock.change}
              onPress={() => goToStockDetails(stock)} // Pass the stock data to the details screen
            />
          ))}
        </View>

        <View style={styles.stockList}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>My Short Positions</Text>
            <Dropdown 

            />
          </View>
          {shortData.map(short => (
            <StockItem
              key={short.id}
              logo={short.logo}
              name={short.name}
              ticker={short.ticker}
              price={short.price}
              change={short.change}
              changePercent={short.change}
              onPress={() => goToStockDetails(short)} // Pass the stock data to the details screen
            />
          ))}
        </View>

        {/* Recent Viral Clips Section */}
        <View style={styles.recentClips}>
          <Text style={styles.sectionTitle}>Recent Viral Clips</Text>
          {/* Replace with real video data */}
          <FlatList
            horizontal
            data={[{ id: '1', video: 'Jake Paul Clip' }, { id: '2', video: 'PewDiePie Clip' }]}
            renderItem={({ item }) => (
              <View style={styles.clipItem}>
                <Text style={styles.clipText}>{item.video}</Text>
              </View>
            )}
            keyExtractor={item => item.id}
          />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: 'Urbanist-Regular', //not working
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    marginBottom: 10,
  },
  accountSummary: {
    marginLeft: 20,
  },
  balanceTitle: {
    //urbanist font
    fontFamily: 'Urbanist-Regular', //not working
    fontSize: 40,
    fontWeight: 'bold',
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
  accountGrid: {
    flex: 1,
    flexDirection: 'row', // Arrange items in rows
    flexWrap: 'wrap', // Wrap to the next row if needed
    alignItems: 'center', // Center items vertically
  },
  accountText: {
    fontSize: 16,
    color: '#6c757d',
  },
  accountTextChange: {
    fontSize: 10,
    color: '#6c757d',
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
  stockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    },
  stockNameLogo: {
    flexDirection: 'row'
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
    width: 40,
    height: 40,
    marginRight: 10,
  },
  stockName: {
    fontSize: 18,
    fontWeight: '500',
  },
  stockTicker: {
    color: '#6c757d',
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '500',
  },
  stockChange: {
    fontSize: 16,
    marginTop: 4,
  },
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
  lineGraph: {
    height: 400,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recentClips: {
    marginLeft: 20,
    marginBottom: 20,
    marginRight: 20,
  },
  clipItem: {
    width: 120,
    height: 120,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 10,
  },
  clipText: {
    fontSize: 14,
    color: '#333',
  },
  miniLogo: {
    width: 20, 
    height: 20,
  },
  miniTitle: {
    fontSize: 20,
    marginLeft: 20,
  },
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    margin: 10,
    backgroundColor: 'white'
  },
});

export default PortfolioScreen;
