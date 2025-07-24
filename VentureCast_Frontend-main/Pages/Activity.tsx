import React from 'react';
import { ScrollView, StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import WatchListItem from './Components/WatchlistItem';
import StaticHeader from './Components/StaticHeader'; 

const ActivityScreen = ({navigation}:any) => {
  // Removed ActivityData dummy array if not used in the UI.


  return (
    <>
      <View style={styles.tempBlock}>

      </View>
      <ScrollView style={styles.container}>
        <View style={styles.titleRowLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Trade Activity</Text>
        </View>
        {/* Removed ActivityData.map((item, index) => (
          <WatchListItem
            key={index}
            profileImage={item.profileImage}
            name={item.name}
            shortName={item.shortName}
            price={item.price}
            priceChange={item.priceChange}
          />
        ))} */}
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
