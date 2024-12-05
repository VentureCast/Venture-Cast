// components/StockItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const StockItem = ({ name, avatar, price, percentage }:any) => {
  return (
    <View style={styles.stockItem}>
      <Image source={{ uri: avatar }} style={styles.stockAvatar} />
      <Text style={styles.stockText}>{name}</Text>
      <Text style={styles.stockPrice}>{price}</Text>
      {percentage && <Text style={styles.stockPercentage}>{percentage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  stockItem: {
    alignItems: 'center',
  },
  stockAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  stockText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  stockPrice: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  stockPercentage: {
    fontSize: 14,
    color: '#E53935',
    marginTop: 5,
  },
});

export default StockItem;
