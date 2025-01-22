import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import PaymentComponent from './Components/PaymentComponent';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  AddPayment: undefined; // create this page
};

const PaymentMethods = () => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const cardData = [
    { nameNumber: 'Apple Pay', profileImage: require('../Assets/Icons/ApplePay.png') , page: 'CardDetailsApple'},
    { nameNumber: 'PayPal', profileImage: require('../Assets/Icons/PayPal.png'), page: 'CardDetailsPayPal'},
    { nameNumber: 'Google Pay', profileImage: require('../Assets/Icons/GooglePay.png') , page: 'CardDetailsGoogle'},
    { nameNumber: '1234 5678 8765 4321', profileImage: require('../Assets/Icons/Visa.png') , page: 'CardDetailsVisa'},
    { nameNumber: '1234 5678 8765 4321', profileImage: require('../Assets/Icons/MasterCard.png') , page: 'CardDetailsMasterCard'},
    { nameNumber: '1234 5678 8765 4321', profileImage: require('../Assets/Icons/AmEx.png') , page: 'CardDetailsAmEx'},
    // Add other items...
  ];

  return (
    <>
      <View style={styles.padBox}></View>
      <ScrollView style={styles.container}>
        <View style = {styles.clipsSubTitle}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image style={styles.leftArrow} source={require('../Assets/Icons/Arrow-Left.png')} />
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddPayment')}>
            <Image style={styles.plus} source={require('../Assets/Icons/plus.png')} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardContainer}>
          {cardData.map((item, index) => ( // never used the index method yet, do remember it from scrimba tho
            <PaymentComponent
              key={index}
              icon={item.profileImage}
              title={item.nameNumber}
              page={item.page}
            />
          ))}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  padBox: {
    height: 60,
    backgroundColor: '#fff', // White background
  },
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
    width: '100%'
  },
  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',

    },
  subTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginHorizontal: 20,

  },
  leftArrow: {
    justifyContent: 'flex-end',
    marginTop: 4,
    width: 23.75,
    height: 20,
  },
  plus: {
    width: 30,
    height: 30,
  },
  
  clipsSubTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 20,
    marginHorizontal: 20,
  },
  cardContainer: {
    marginTop: 20,
  },
});

export default PaymentMethods;
