// components/StockItems.tsx
//this appears only on the homepage (as of now)
import React from 'react';
import formatCurrency from './formatCurrency';
import { View, Text,StyleSheet, TouchableOpacity, Image } from 'react-native';

const StockItems = ({ logo, name, ticker, price, change, changePercent, onPress }:any) => {

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
            <Text style={styles.stockPrice}>{formatCurrency(price)}</Text>
            <Text style={[styles.stockChange, change >= 0 ? styles.positive : styles.negative]}>
              {change >= 0 ? `+${changePercent}%` : `${changePercent}%`}
            </Text>
          </View>
      </View>
    </TouchableOpacity>
  );
};

// session 2:
//  then duplicate it for the next stock section

const styles = StyleSheet.create({

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

});

export default StockItems;
