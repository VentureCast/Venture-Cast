import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';

const StockOrderScreen = ({ navigation }:any) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.stockHeader}>
          {/* <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' }}
            style={styles.stockLogo}
          /> */}
          <View>
            <Text style={styles.stockName}>Dude Perfect</Text>
            <Text style={styles.stockTicker}>DUP</Text>
          </View>
        </View>
        <Text style={styles.marketPrice}>$71.05</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Market Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Orders</Text>

          <TouchableOpacity style={styles.orderItem} onPress={()=>{
                navigation.navigate('BuyStock')
              }}>
            {/* <Image source={require('./assets/buy-icon.png')} style={styles.icon} /> */}
            <View >
              <Text style={styles.orderTitle}>Buy Stock</Text>
              <Text style={styles.orderDescription}>
                Buy stock for a dollar value at a minimum of $1.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.orderItem}>
            {/* <Image source={require('./assets/sell-icon.png')} style={styles.icon} /> */}
            <View>
              <Text style={styles.orderTitle}>Sell Stock</Text>
              <Text style={styles.orderDescription}>
                Sell some or all of your equity at minimum of $1.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.orderItem}>
            {/* <Image source={require('./assets/short-sell-icon.png')} style={styles.icon} /> */}
            <View>
              <Text style={styles.orderTitle}>Short Sell</Text>
              <Text style={styles.orderDescription}>
                To complete this action, your account must have three times the order size available for margin borrowing and share repurchase.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Conditional Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditional Order</Text>

          <TouchableOpacity style={styles.orderItem}>
            {/* <Image source={require('./assets/limit-buy-icon.png')} style={styles.icon} /> */}
            <View>
              <Text style={styles.orderTitle}>Buy Limit Order</Text>
              <Text style={styles.orderDescription}>
                Limit orders allow you to set the maximum or minimum price for which you will buy or sell a stock, respectively.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.orderItem}>
            {/* <Image source={require('./assets/limit-sell-icon.png')} style={styles.icon} /> */}
            <View>
              <Text style={styles.orderTitle}>Sell Limit Order</Text>
              <Text style={styles.orderDescription}>
                Limit orders allow you to set the maximum or minimum price for which you will buy or sell a stock, respectively.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#000',
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  stockName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockTicker: {
    fontSize: 14,
    color: '#888',
  },
  marketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default StockOrderScreen;
