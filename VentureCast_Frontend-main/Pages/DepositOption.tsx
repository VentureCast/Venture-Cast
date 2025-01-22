import React from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import BankItem from './Components/BankItem';
import PaymentComponent from './Components/PaymentComponent';


const bankingData = [
  {id: '1', name: 'Bank of America', userName: 'Alexander Creighton', icon: require('../Assets/Icons/BankofAmerica.png'), page: 'WithdrawBOA'}, // not going to use page modifier yet
  {id: '2', name: 'JP Morgan Chase', userName: 'Alexander Creighton', icon: require('../Assets/Icons/Chase.png'), page: 'WithdrawC'},
  {id: '3', name: 'Toronto Dominion Bank', userName: 'Alexander Creighton', icon: require('../Assets/Icons/TDBank.png'), page: 'WithdrawTD'},
  {id: '4', name: 'Capital One', userName: 'Alexander Creighton', icon: require('../Assets/Icons/CapitalOne.png'), page: 'WithdrawCO'},
];

const cardData = [
  { nameNumber: 'Apple Pay', profileImage: require('../Assets/Icons/ApplePay.png') , page: 'CardDetailsApple'},
  { nameNumber: 'PayPal', profileImage: require('../Assets/Icons/PayPal.png'), page: 'CardDetailsPayPal'},
  { nameNumber: 'Google Pay', profileImage: require('../Assets/Icons/GooglePay.png') , page: 'CardDetailsGoogle'},
  { nameNumber: '1234 5678 8765 4321', profileImage: require('../Assets/Icons/Visa.png') , page: 'CardDetailsVisa'},
  { nameNumber: '1234 5678 8765 4321', profileImage: require('../Assets/Icons/MasterCard.png') , page: 'CardDetailsMasterCard'},
  { nameNumber: '1234 5678 8765 4321', profileImage: require('../Assets/Icons/AmEx.png') , page: 'CardDetailsAmEx'},
 ];

const DepositOption = ({ navigation }:any) => {


  return (
    <>
      <View style={styles.padBox}></View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
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
            page= 'Deposit' />
            ))}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Other Payment Methods</Text>
        </View>
        <View style={styles.optionsContainer}>
          {cardData.map((item, index) => ( // never used the index method yet, do remember it from scrimba tho
          <PaymentComponent
            key={index}
            icon={item.profileImage}
            title={item.nameNumber}
            page= 'Deposit' 
          />
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

export default DepositOption;
