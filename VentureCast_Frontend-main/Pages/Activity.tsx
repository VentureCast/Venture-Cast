import React from 'react';
import { ScrollView, StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import WatchListItem from './Components/WatchlistItem';
import StaticHeader from './Components/StaticHeader'; 

const ActivityScreen = ({navigation}:any) => {
  const ActivityData = [
    { name: 'Dude Perfect', shortName: 'DUPT', price: 73331.50, priceChange: 2.94, profileImage: require('../Assets/Images/dude-perfect.png') },
    { name: 'PewDiePie', shortName: 'PDP', price: 900.79, priceChange: -2.16, profileImage: require('../Assets/Images/pewdiepie.png') },
    { name: 'Jake Paul', shortName: 'JKPI', price: 2007.47, priceChange: 2.37, profileImage: require('../Assets/Images/jake-paul.png') },
    // Add other items...
  ];


  return (
    <>
      <View style={styles.tempBlock}>

      </View>
      <ScrollView style={styles.container}>
        <View style={styles.titleRowLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Transaction Activity</Text>
        </View>
        {ActivityData.map((item, index) => (
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
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
    marginRight: 10,
  },

  //temporary block to push down the header
  tempBlock: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Urbanist',
    },
  titleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 20,
  },
});

export default ActivityScreen;
