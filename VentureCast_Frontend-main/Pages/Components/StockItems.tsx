// components/StockItems.tsx
//this appears only on the homepage (as of now)
import React from 'react';
import { View, Text,StyleSheet, TouchableOpacity, Image } from 'react-native';

const StockItems = ({ logo, ticker, price, change, changePercent, onPress }:any) => {

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.stockItem}>
        <View style={styles.stockNameLogo}> 
          <Image source={logo} style={styles.stockLogo} />
          <View>
            <Text style={styles.stockTicker}>{ticker}</Text>
          </View>
        </View>
          <View style={styles.stockPriceContainer}>
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
    alignItems: 'center', 
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },   
  stockLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
  }, 
  stockTicker: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    fontFamily: 'Urbanist-Regular',
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockChange: {
    fontSize: 16,
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
