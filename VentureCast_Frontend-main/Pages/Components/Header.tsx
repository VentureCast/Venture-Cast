// components/Header.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

const Header = ({ balance, change }:any) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.logoText}>VC</Text>
        {/* <Ionicons name="notifications-outline" size={24} color="#fff" /> */}
      </View>
      <Text style={styles.balance}>{balance}</Text>
      <Text style={styles.balanceChange}>{change}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#5D2DFD',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  balance: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  balanceChange: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 5,
  },
});

export default Header;
