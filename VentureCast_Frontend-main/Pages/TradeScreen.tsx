import React from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import TradeItem from './Components/TradeItem';

const TradeScreen = () => {

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}></Text>
        </View>
          <View style={styles.optionsContainer}>
          <TradeItem 
            title='Buy Stock'
            description='Buy stock for as little as just one dollar.'
            icon={require('../Assets/Icons/BuyStock.png')}
            page= 'BuyInter' 
            />

          <TradeItem 
            title='Sell Stock'
            description='Sell some or all of you stock holdings to turn a profit.'
            icon={require('../Assets/Icons/SellStock.png')}
            page= 'SellInter'
            />

          <TradeItem 
            title='Short Sell Stock'
            description='Bet against any stock so long as you have three time the borrowing ammount in your account.'
            icon={require('../Assets/Icons/ShortSell.png')}
            page= 'ShortInter'
            />

          <TradeItem 
            title='Deposit to VentureCast'
            description='Transfer funds instantly to your VentureCast account.'
            icon={require('../Assets/Icons/Deposit.png')}
            page= 'DepositOption'
            />

          <TradeItem 
            title='Withdraw from VentureCast'
            description='Transfer funds from VentureCast account to a bank account of your choosing.'
            icon={require('../Assets/Icons/Withdraw.png')}
            page= 'WithdrawOption'
            /> 
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
    width: '100%'
  },
// notif title and back arrow
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Urbanist',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 10,
      justifyContent: 'space-between',
    },
    optionsContainer: {

    }, 
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 20,
      marginLeft: 20,
      marginRight: 40,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderColor: '#ccc',
    },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    arrow: {
    },
    icon: {
      width: 60,
      height: 60,
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
      paddingRight: 30,
      alignContent: 'center',
    },
    title: {
      fontFamily: 'Urbanist',
      fontWeight: 'bold',
      fontSize: 18,
    },
    description: {
      fontFamily: 'Urbanist',
      fontSize: 14,
      fontWeight: 300,
      marginTop: 10,
      color: '#555',
    },
});

export default TradeScreen;
