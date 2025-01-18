import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import WatchListItem from './Components/WatchlistItem';
import StaticHeader from './Components/StaticHeader'; 

const WatchListScreen = () => {
  const watchList = [
    { name: 'Dude Perfect', shortName: 'DUPT', price: '$71.05', priceChange: '+2.94%', profileImage: require('../Assets/Images/dude-perfect.png') },
    { name: 'PewDiePie', shortName: 'PDP', price: '$90.79', priceChange: '-2.16%', profileImage: require('../Assets/Images/pewdiepie.png') },
    { name: 'Jake Paul', shortName: 'JKPI', price: '$207.47', priceChange: '+2.37%', profileImage: require('../Assets/Images/jake-paul.png') },
    // Add other items...
  ];

  return (
    <>
      <ScrollView style={styles.container}>
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
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
    width: '100%'
  },

  //temporary block to push down the header
  tempBlock: {
    height: 50,
    width: '100%',
    backgroundColor: '#351560',
  }
});

export default WatchListScreen;
