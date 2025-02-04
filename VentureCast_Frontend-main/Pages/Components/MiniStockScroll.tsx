// components/MiniStockScroll.tsx
//this appears only on the homepage (as of now)
import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatCurrency from './formatCurrency';

type RootStackParamList = {
  StockPage: undefined; // Define your route and parameters here
};

const stockScrollData = [
  {id: '1', name: "MrBeast", ticker: "MBT", price: 30.98, percentage: -1.98, graph: require('../../Assets/Graphs/Mega-Nega-1.png'), avatar: require('../../Assets/Images/JimmyBeast.png') },
  {id: '2', name: "Dude Perfect", ticker: "DUPT", price: 71.05, percentage: 2.94, graph: require('../../Assets/Graphs/Mega-Posi-1.png'), avatar: require('../../Assets/Images/dude-perfect.png')},
  {id: '3', name: "Mark Rober", ticker: "MKRB", price: 89.03,  percentage: 10.45, graph: require('../../Assets/Graphs/Mega-Posi-1.png'), avatar: require('../../Assets/Images/MahkyMahk.png')},
  {id: '4', name: "PewDiePie", ticker: "PDP", price: 98.30,  percentage: 14.45, graph: require('../../Assets/Graphs/big-positive-graph-2.png'), avatar: require('../../Assets/Images/pewdiepie.png')},
  {id: '5', name: "Clark Rober", ticker: "CKRB", price: 39.08,  percentage: 5.45, graph: require('../../Assets/Graphs/big-positive-graph-2.png'), avatar: require('../../Assets/Images/MahkyMahk.png')},
  {id: '6', name: "Bark Rober", ticker: "BKRB", price: 12.34,  percentage: 100.45, graph: require('../../Assets/Graphs/big-positive-graph-2.png'), avatar: require('../../Assets/Images/MahkyMahk.png')},
  ];

const MiniStockScroll = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const formatPercentage = (number: number): string => {
    return `${number.toLocaleString('en-US')}%`; // Adds ( %) and formats the number
  };

  return (
  <View style={styles.shadowContainer}>
    <FlatList
      data={stockScrollData}
      renderItem={({ item }) => (
      <TouchableOpacity onPress={() => navigation.navigate('StockPage')}>
        <View style={styles.container}>
          <View style={styles.miniStockScroll}>
            <Image source={item.avatar} style={styles.stockAvatar} />
            <View style = {styles.infoContainer}>
              <View style = {styles.textContainer}>
                <Text style={styles.stockText}>{item.name}</Text>
                <Text style={styles.stockTicker}>{item.ticker}</Text>
              </View>
              <View style={styles.numberContainer}>
                <Text style={[styles.stockPercentage, 
                item.percentage >= 0 ? styles.positive : styles.negative]}
                >{formatPercentage(item.percentage)}</Text>
                <Text style={styles.stockPrice}>{formatCurrency(item.price)}</Text>
              </View>
            </View>
          </View>
          <Image source={item.graph} style={styles.graph} />
        </View>
      </TouchableOpacity>
         )}
         keyExtractor={(item) => item.id}
         horizontal={true} // Enable horizontal scrolling
         showsHorizontalScrollIndicator={true} // show the scroll indicator
      />
   </View>
  );
};

// session 2:
//  then duplicate it for the next stock section

const styles = StyleSheet.create({

  shadowContainer: {
    borderRadius: 20, // Ensure it matches the inner container's borderRadius
    shadowColor: '#351560', 
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 }, // Moves shadow downward
    shadowRadius: 5,
    elevation: 5, // For Android
  },
  container: {
    flexDirection: 'column',
    borderRadius: 20,
    borderWidth: 0.1,
    borderColor: '#351560',
    marginRight: 15,
    backgroundColor: '#fff', // Ensures shadow doesn't affect internals
    overflow: 'hidden', // Prevents shadow inside the border
  },
  miniStockScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  infoContainer: {
    marginLeft: 10,
  },
  textContainer: {
    flexDirection: 'column',
    width: 130,
    marginBottom: 5,
  },
  stockAvatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  stockText: {
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  stockTicker: {
    fontFamily: 'Urbanist',
    fontWeight: '500',
    fontSize: 9.55,
    color: '#757575',
    marginTop: 5,
  },
  numberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockPrice: {
    justifyContent: 'flex-end',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    color: '#212121',
  },
  stockPercentage: {
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    color: '#E53935',
  },
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
  },
  graph: {
    borderBottomStartRadius: 20,
    borderBottomEndRadius: 20,
    height: 80,
    width: 200,
  },
});

export default MiniStockScroll;
