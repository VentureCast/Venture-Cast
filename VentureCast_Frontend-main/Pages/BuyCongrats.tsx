import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import formatCurrency from './Components/formatCurrency';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Portfolio: undefined; 
  Home: undefined; 
};


const BuyCongrats = () => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  const buyData = {name: 'Dude Perfect', ticker: 'DUPT', netBuy: 10000, icon: require('../Assets/Images/dude-perfect.png') }

  return (
    <>
      <View style={styles.padBox}></View>
      <View style={styles.container}>
        {/* stock item header -- need this to be recieved data*/}
        <View style={styles.header}>
          <Image source={buyData.icon} style={styles.stockImage} />
          <Text style={styles.headerTitle}>{buyData.name}</Text>
          <Text style={styles.headerSubTitle}>{buyData.ticker}</Text>
        </View>
        {/* image and value*/}
        <View style={styles.midContainer}>
          <Image source={require('../Assets/Images/Congrats.png')} style={styles.congratsImage} />
          <Text style={styles.buyValue}>{formatCurrency(buyData.netBuy)}</Text>
          <Text style={styles.buyTitle}>Buy Order Recieved!</Text>
          <Text style={styles.buySubTitle}>Your order has been receieved and will be executed as soon as possible.</Text>
        </View>
        {/* Buttons*/}
        <TouchableOpacity onPress={() =>  navigation.navigate('Portfolio')}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>View My Portfolio</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() =>  navigation.navigate('Home')}>
          <View style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Home</Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  padBox: {
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  stockImage: {
    height: 90,
    width: 90, 
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  headerTitle: {
    fontFamily: 'urbanist',
    fontWeight: 'bold',
    marginVertical: 10,
    fontSize: 30,
  },
  headerSubTitle: {
    fontFamily: 'urbanist',
    fontWeight: '500', 
    fontSize: 16,
  },
  //mid section
  midContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 80,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE', 

   },
   congratsImage: {
    width: 300, 
    height: 168,
  },
  buyValue: {
    fontFamily: 'urbanist',
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#351560',
    fontSize: 46,
  },
  buyTitle: {
    fontFamily: 'urbanist',
    fontWeight: '600',
    marginVertical: 20,
    fontSize: 20,
  },
  buySubTitle: {
    marginHorizontal: 15,
    textAlign: 'center',
    fontFamily: 'urbanist',
    fontWeight: '400', 
    fontSize: 16,
    color: '#757575',
  },
  //buttons
  button: {
    backgroundColor: '#351560',
    borderRadius: 20,
    marginBottom: 10,
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center' ,

  },
  buttonText: {
    fontFamily: 'urbanist',
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 18,
  },
  homeButton: {
    backgroundColor: '#EAE7EF',
    borderRadius: 20,
    marginVertical: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center' ,

  },
  homeButtonText: {
    fontFamily: 'urbanist',
    fontWeight: 'bold',
    color: '#351560',
    fontSize: 18,
  },
});

export default BuyCongrats;
