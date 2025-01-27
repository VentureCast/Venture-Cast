// components/StockItemHeader.tsx
import React from 'react';
import formatCurrency from './formatCurrency';
import { View, Text,StyleSheet, Image } from 'react-native';

const StockItemHeader = ({ logo, name, ticker, price, change, changePercent }:any) => {

  return (
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
    paddingVertical: 15,
  },
  stockLogo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  stockName: {
    fontSize: 18,
    color: 'white',
    fontWeight: '800',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 5,
  },
  stockTicker: {
    color: '#6c757d',
    fontFamily: 'Urbanist-Regular',
    fontWeight: '700',
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Urbanist-Regular',
  },
  stockChange: {
    fontSize: 14,
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

export default StockItemHeader;
