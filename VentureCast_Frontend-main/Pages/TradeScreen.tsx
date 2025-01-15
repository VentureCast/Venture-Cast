import React from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import StaticHeader from './Components/StaticHeader';
import { useNavigation } from '@react-navigation/native';

const TradeScreen = () => {
  const navigation = useNavigation();

  return (
    <>
      <StaticHeader />
      <ScrollView style={styles.container}>
        <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Trading Hub</Text>
        </View>
          <View style={styles.optionsContainer}>
            <View style={styles.itemContainer}>
              <View style={styles.leftContainer}>
                <Image source={require('../Assets/Icons/BuyStock.png')} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Buy Stock</Text>
                  <Text style={styles.description}>Buy stock for as little as just one dolla.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BuyStock')} // that is the wrong screen
              >
                <Image source={require('../Assets/Icons/Arrow-right-2.png')} style={styles.arrow} />
              </TouchableOpacity>
            </View>
            <View style={styles.itemContainer}>
              <View style={styles.leftContainer}>
                <Image source={require('../Assets/Icons/SellStock.png')} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Sell Stock</Text>
                  <Text style={styles.description}>Sell some or all of you stock holdings to turn a profit.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BuyStock')} // that is the definitely the wrong screen
              >
                <Image source={require('../Assets/Icons/Arrow-right-2.png')} style={styles.arrow} />
              </TouchableOpacity>
            </View>
            <View style={styles.itemContainer}>
              <View style={styles.leftContainer}>
                <Image source={require('../Assets/Icons/ShortSell.png')} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Short Sell</Text>
                  <Text style={styles.description}>Bet against any stock so long as you have three time the borrowing ammount in your account.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BuyStock')} // that is the definitely the wrong screen
              >
                <Image source={require('../Assets/Icons/Arrow-right-2.png')} style={styles.arrow} />
              </TouchableOpacity>
            </View>
            <View style={styles.itemContainer}>
              <View style={styles.leftContainer}>
                <Image source={require('../Assets/Icons/Deposit.png')} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Deposit to VentureCast</Text>
                  <Text style={styles.description}>Transfer funds instantly to your VentureCast account.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BuyStock')} // that is the definitely the wrong screen
              >
                <Image source={require('../Assets/Icons/Arrow-right-2.png')} style={styles.arrow} />
              </TouchableOpacity>
            </View>
            <View style={styles.itemContainer}>
              <View style={styles.leftContainer}>
                <Image source={require('../Assets/Icons/Withdraw.png')} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Withdraw from VentureCast</Text>
                  <Text style={styles.description}>Transfer funds from VentureCast account to a bank account of your choosing.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BuyStock')} // that is the definitely the wrong screen
              >
                <Image source={require('../Assets/Icons/Arrow-right-2.png')} style={styles.arrow} />
              </TouchableOpacity>
            </View>
            <View style={styles.itemContainer}>
              <View style={styles.leftContainer}>
                <Image source={require('../Assets/Icons/PaymentMethod.png')} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Payment Methods</Text>
                  <Text style={styles.description}>Access and manage your bank alternative payment methods.</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BuyStock')} // that is the definitely the wrong screen
              >
                <Image source={require('../Assets/Icons/Arrow-right-2.png')} style={styles.arrow} />
              </TouchableOpacity>
            </View>
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
      margin: 20,
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
