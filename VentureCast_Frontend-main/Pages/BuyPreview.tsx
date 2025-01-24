import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatCurrency from './Components/formatCurrency';

type RootStackParamList = {
  BuyCongrats: undefined;
};

const BuyPreview = ({ }:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [investmentAmount, setInvestmentAmount] = useState('10000');

  const user = {firstName: 'Alexander', lastName: 'Creighton', cash: 23087.39, accountNumber: '**** **** **** 4321',
  stockName: 'DUPT', stockLongName: 'Dude Perfect', stockCost: 71.50}; //user data

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Back</Text>
      </View>

      {/* Stock Info */}
      <View style={styles.stockInfo}>
        <View  style={styles.leftContainer}>
          <Image
            source={require('../Assets/Images/dude-perfect.png')} // Update with your stock image
            style={styles.stockLogo}
          />
          <View>
            <Text style={styles.stockName}>{user.stockLongName}</Text>
            <Text style={styles.stockTicker}>{user.stockName}</Text>
          </View>
        </View>
        <Text style={styles.marketPrice}>{formatCurrency(user.stockCost)}</Text>
      </View>

      {/* Preview */}
      <View style={styles.previewContainer}>
        <View style={styles.thirdContainer}>
          <View style={styles.subContainer}>
            <Text style={styles.previewText}>Market Price</Text>
            <Text style={styles.numberText}>{formatCurrency(71.10)}</Text>
          </View>
          <View style={styles.subContainer}> 
            <Text style={styles.previewText}>Number of Shares</Text>
            <Text style={styles.numberText}>0.013659756</Text>
          </View>
        </View>
        <View style={styles.thirdContainer}>
          <View style={styles.subContainer}>
            <Text style={styles.previewText}>Market Ask</Text>
            <Text style={styles.numberText}>{formatCurrency(71.30)}</Text>
          </View>
          <View style={styles.subContainer}> 
            <Text style={styles.previewText}>Bid-Ask Spread</Text>
            <Text style={styles.numberText}>{formatCurrency(0.20)}</Text>
          </View>
        </View>
          <View style={styles.subContainer}>
            <Text style={styles.previewText}>Total Cost</Text>
            <Text style={styles.numberText}>{formatCurrency(10050)}</Text>
          </View>
      </View>

      {/* confirm Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={()=> {
      navigation.navigate('BuyCongrats') // withdraw/deposit preview
        }}>
        <Text style={styles.confirmText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', 
  },
  leftContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 60,
  },
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
    fontFamily: 'urbanist',
  },
  previewContainer: {
    paddingHorizontal: 20,
    margin: 20,
    marginTop: 5,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  subContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
  },
  thirdContainer: {
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    paddingVertical: 15,
  },
  numberText: {
    fontFamily: 'urbanist',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewText: {
    fontFamily: 'urbanist',
    fontSize: 18,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  stockLogo: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  stockName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    marginBottom: 5,
  },
  stockTicker: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'urbanist',
  },
  marketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
  confirmButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  confirmText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
});

export default BuyPreview;
