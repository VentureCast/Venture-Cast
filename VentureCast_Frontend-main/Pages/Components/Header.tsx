// components/Header.tsx
import React from 'react';
import { View, Text, ImageBackground, Image} from 'react-native';
import { StyleSheet } from 'react-native';
import ActionButton from './ActionButton';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  DepositOption: undefined;
};



const arrowUp = require('../../Assets/Icons/Arrow-Up-White.png');
const arrowDown = require('../../Assets/Icons/Arrow-Down-White.png');

const Header = ({ balance, percentChange, moneyChange }:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <ImageBackground source={require('../../Assets/Images/portfolio-background.png')}>
      <View style={styles.header}>
        <Text style={styles.balance}>${balance}</Text>
        <View style={styles.changeRow}>
          <Image source={percentChange >= 0 ? arrowUp : arrowDown } style={styles.arrowIcon}/>
          <Text style={[styles.balanceChange, percentChange >= 0 ? styles.positive : styles.negative]}>${moneyChange} ({percentChange}%)</Text>
        </View>
      </View>
      <View style={styles.actionButtonContainer}>
        <ActionButton label="Deposit" onPress={() => navigation.navigate('DepositOption')} large={false} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'transparent',
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  balance: {
    fontFamily: 'Urbanist',
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 10,
  },
  balanceChange: {
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 5,
  },
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
    marginTop: 5,
  },

  actionButtonContainer: {
    marginBottom: 20,
  }
});

export default Header;
