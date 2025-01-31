import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import WatchListItem from './Components/WatchlistItem';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Discover: undefined; // Do this for all linked pages
};


const WatchListScreen = ( ) => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const watchList = [
    { name: 'Dude Perfect', shortName: 'DUPT', price: 71.50, priceChange: 2.94, profileImage: require('../Assets/Images/dude-perfect.png') },
    { name: 'PewDiePie', shortName: 'PDP', price: 90.79, priceChange: -2.16, profileImage: require('../Assets/Images/pewdiepie.png') },
    { name: 'Jake Paul', shortName: 'JKPI', price: 207.47, priceChange: 2.37, profileImage: require('../Assets/Images/jake-paul.png') },
    // Add other items... 
  ];

  return (
    <>
      <View style={styles.padBox}></View>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRowLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Watchlist</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
            <Text style={styles.backButton}>+</Text>
          </TouchableOpacity>
        </View>
        {watchList.map((item, index) => (
          <WatchListItem
            key={index}
            profileImage={item.profileImage}
            name={item.name}
            shortName={item.shortName}
            price={item.price}
            priceChange={item.priceChange}
          />
        ))}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  padBox: {
    height: 60,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
    width: '100%'
  },

  //header

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
    marginRight: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Urbanist',
    },
  titleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 20,
  },

  //temporary block to push down the header
  tempBlock: {
    height: 50,
    width: '100%',
    backgroundColor: '#351560',
  }
});

export default WatchListScreen;
