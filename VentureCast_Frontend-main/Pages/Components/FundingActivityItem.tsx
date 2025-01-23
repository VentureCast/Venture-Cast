import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import formatCurrency from './formatCurrency';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatDate from './formatDate';

type RootStackParamList = {
  page: undefined;  
};

const FundingActivityItem = ({ icon, name, value, page, date }:any) => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <>
      <TouchableOpacity onPress={() => navigation.navigate(page)}>
        <View style={styles.itemContainer}>
          <View style={styles.container}>
            <Image source={icon} style={styles.profileImage} />
            <View>
              <Text style={styles.date}>{formatDate(date)}</Text>
              <Text style={styles.name}>{name}</Text>
            </View>
          </View>
          <Text style={[styles.price, value >= 0 ? styles.positive : styles.negative]}>
            {value >= 0 ? `+${formatCurrency(value)}` : `${formatCurrency(value)}`}</Text>
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    paddingVertical: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: '400',
    fontSize: 14,
    fontFamily: 'urbanist',
    color: '#757575'
  },
  price: {
    fontWeight: '600',
    fontSize: 18,
    fontFamily: 'urbanist',
  },
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
  },
  date: {
    fontWeight: '600',
    fontSize: 18,
    fontFamily: 'urbanist',
    marginBottom: 10,
  },
});

export default FundingActivityItem;
