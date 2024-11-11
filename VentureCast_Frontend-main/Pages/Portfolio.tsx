import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import NotificationSettings from './Account/NotificationControl';
import AboutVentureCastScreen from './Account/About';
import LanguageSelectionScreen from './Account/Language';
import HelpCenter from './Account/HelpCenter';

// Reusable component for Stock Item
const StockItem = ({ logo, name, ticker, price, change, changePercent, onPress }: any) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.stockItem}>
        <Image source={logo} style={styles.stockLogo} />
        <View>
          <Text style={styles.stockName}>{name}</Text>
          <Text style={styles.stockTicker}>{ticker}</Text>
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

// Reusable component for Line Graph (Placeholder for now)
const LineGraph = ({ color }: any) => (
  <View style={[styles.lineGraph, { borderColor: color }]}>
    {/* You can implement a real graph using react-native-svg or similar libraries */}
    <Text style={{ color }}>Graph</Text>
  </View>
);

const PortfolioScreen = ({ navigation }: any) => {
  // Sample data for stock positions
  const stockData = [
    { id: '1', name: 'Dude Perfect', ticker: 'DUPT', price: '71.05', change: 2.94, logo: require('../Assets/Images/dude-perfect.png') },
    { id: '2', name: 'PewDiePie', ticker: 'PDP', price: '90.79', change: -2.16, logo: require('../Assets/Images/pewdiepie.png') },
    { id: '3', name: 'Jake Paul', ticker: 'JKPI', price: '207.47', change: 2.37, logo: require('../Assets/Images/jake-paul.png') },
  ];

  // Function to handle stock item press
  const goToStockDetails = (stock: any) => {
    navigation.navigate('StockDetails', { stock });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Summary Section */}
      <View style={styles.accountSummary}>
        <Text style={styles.balanceTitle}>$229,375.25</Text>
        <View style={styles.accountDetails}>
          <Text style={styles.accountText}>Cash: $23,087.39</Text>
          <Text style={styles.accountText}>Equity: $186,473.68</Text>
        </View>
      </View>

      {/* Line Graph */}
      <LineGraph color="green" />

      {/* Stock Positions */}
      <View style={styles.stockList}>
        <Text style={styles.sectionTitle}>My Stock Positions</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  accountSummary: {
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  accountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  accountText: {
    fontSize: 16,
    color: '#6c757d',
  },
  stockList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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
    marginRight: 15,
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
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recentClips: {
    marginBottom: 20,
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
});

export default PortfolioScreen;
