// components/ClipItem.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ClipItem = ({ title, subtitle }:any) => {
  return (
    <View style={styles.clipItem}>
      <Text style={styles.clipTitle}>{title}</Text>
      <Text style={styles.clipSubtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  clipItem: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  clipTitle: {
    fontSize: 16,
    color: '#333',
  },
  clipSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
});

export default ClipItem;
