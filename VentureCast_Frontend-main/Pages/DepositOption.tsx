import React from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import BankItem from './Components/BankItem';
import PaymentComponent from './Components/PaymentComponent';


// Removed bankingData and cardData dummy arrays if not used in the UI.

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
          {/* Removed bankingData.map(bank => ( */}
          <BankItem 
            key={'1'} // Placeholder for now
            title={'Alexander Creighton'}
            description={'Bank of America'}
            icon={require('../Assets/Icons/BankofAmerica.png')}
            page= 'Deposit' />
            {/* Removed bankingData.map(bank => ( */}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Other Payment Methods</Text>
        </View>
        <View style={styles.optionsContainer}>
          {/* Removed cardData.map((item, index) => ( */}
          <PaymentComponent
            key={'1'} // Placeholder for now
            icon={require('../Assets/Icons/ApplePay.png')}
            title={'Apple Pay'}
            page= 'Deposit' 
          />
          {/* Removed cardData.map((item, index) => ( */}
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
