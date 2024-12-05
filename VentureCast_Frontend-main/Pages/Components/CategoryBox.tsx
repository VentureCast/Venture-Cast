// components/CategoryBox.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CategoryBox = ({ name, percentage, color }:any) => {
  return (
    <View style={styles.categoryBox}>
      <Text style={styles.categoryText}>{name}</Text>
      <Text style={[styles.categoryPercentage, { color: color }]}>{percentage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryBox: {
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default CategoryBox;
