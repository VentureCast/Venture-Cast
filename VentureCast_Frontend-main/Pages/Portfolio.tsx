import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import { Button } from 'react-native-paper';
import Dropdown from './Components/Dropdown'; // does not do anything but is visible
import StaticHeader from './Components/StaticHeader';
import { useNavigation } from '@react-navigation/native';

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



// Portfolio screen starts

const PortfolioScreen = ({navigation}:any) => {
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

// do not know where the portfolio header is created or called, want it gone.
//also want the gray bar gone so that the logo and the name hover over the 
  return (
    <>
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
              onPress={() => navigation.navigate('stock')} // Pass the stock data to the details screen
            />
          ))} 
          
          {/* need this to be a button that opens up more stock items */}
          <Button style={styles.showMoreButton}>Show More</Button>
        </View>


        {/* short Positions */} 
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
              onPress={() => navigation.navigate('short')} // Pass the stock data to the details screen, need to create a prop that actually does this
            />
          ))}

         {/* need this to be a button that opens up more short items */}
          <Button style={styles.showMoreButton}>Show More</Button>
        </View>

        {/* Recent Viral Clips Section */}
        <View style={styles.recentClips}>
          <View style = {styles.recentClipsTitle}>
            <Text style={styles.sectionTitle}>Recent Viral Clips</Text>
         {/* need this to be a button that opens up more clips */}
            <TouchableOpacity onPress={() => navigation.navigate('ClipsPage')}>
              <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
            </TouchableOpacity>
          </View>
          {/* we want each section to pull from a database of clips for the stocks that are presented above the clips */}

          <View  style={styles.clipStockItem}>
            <View style={styles.stockNameLogo}> 
              <Image source={require('../Assets/Images/jake-paul.png')} style={styles.stockLogo} />
              <View>
                <Text style={styles.stockName}>Jake Paul</Text>
                <Text style={styles.stockTicker}>JKPL</Text>
              </View>
            </View>
            <Image source={require('../Assets/Icons/Arrow-right.png')} />
          </View>
          {/* Replace with real video data */}
          <FlatList
            horizontal
            data={[
              { id: '1', video: 'Clip 1',  image: require('../Assets/Images/Clip1.png')}, 
              { id: '2', video: 'Clip 2', image: require('../Assets/Images/Clip2.png')},
              { id: '3', video: 'Clip 3', image: require('../Assets/Images/Clip3.png')}, 
              ]}
            renderItem={({ item }) => (
              <View style={styles.clipItem}>
                <Image style={styles.clipImage} source = {item.image} />
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

  // the user balance

  balanceTitle: {
    fontFamily: 'Urbanist-Regular',
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
// user acct info section

  accountGrid: {
    flex: 1,
    flexDirection: 'row', // Arrange items in rows
    flexWrap: 'wrap', // Wrap to the next row if needed
    alignItems: 'center', // Center items vertically
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

// stock/short list section

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
    fontSize: 16,
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

  // graph; yet to be completed
  lineGraph: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
