import React from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import BankItem from './Components/BankItem';


const bankingData = [
  {id: '1', name: 'Bank of America', userName: 'Alexander Creighton', icon: require('../Assets/Icons/BankofAmerica.png'), page: 'WithdrawBOA'}, // not going to use page modifier yet
  {id: '2', name: 'JP Morgan Chase', userName: 'Alexander Creighton', icon: require('../Assets/Icons/Chase.png'), page: 'WithdrawC'},
  {id: '3', name: 'Toronto Dominion Bank', userName: 'Alexander Creighton', icon: require('../Assets/Icons/TDBank.png'), page: 'WithdrawTD'},
  {id: '4', name: 'Capital One', userName: 'Alexander Creighton', icon: require('../Assets/Icons/CapitalOne.png'), page: 'WithdrawCO'},
];

const WithdrawOption = ({ navigation }:any) => {


  return (
    <>
      <View style={styles.padBox}></View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Your Bank Accounts</Text>
        </View>
        <View style={styles.optionsContainer}>
          {bankingData.map(bank => (
          <BankItem 
            key={bank.id}
            title={bank.userName}
            description={bank.name}
            icon={bank.icon}
            page= 'Withdraw' />
            ))}
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
  padBox: {
    height: 60,
    backgroundColor: '#fff', // White background
  },
// notif title and back arrow
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Urbanist',
    padding: 20,
    paddingLeft: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 10,
      justifyContent: 'space-between',
    },
    optionsContainer: {

    }, 

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      backgroundColor: 'white',
    },
    backButton: {
      fontSize: 26,
      color: '#000',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      fontFamily: 'urbanist',
      marginLeft: 20,
    },
  
});

export default WithdrawOption;
