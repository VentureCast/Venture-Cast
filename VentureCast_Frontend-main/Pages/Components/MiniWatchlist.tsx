// components/MiniWatchlist.tsx
//this appears only on the homepage (as of now)
import React from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';

const watchlistData = [
  {id: '1', name: "MrBeast", percentage: -1.98, graph: require('../../Assets/Graphs/big-negative-graph-1.png'), avatar: require('../../Assets/Images/JimmyBeast.png') },
  {id: '2', name: "Billie", percentage: 2.45, graph: require('../../Assets/Graphs/big-positive-graph-1.png'), avatar: require('../../Assets/Images/Billy-Eyelash.png')},
  {id: '3', name: "Mark Rober", percentage: 10.45, graph: require('../../Assets/Graphs/big-positive-graph-2.png'), avatar: require('../../Assets/Images/MahkyMahk.png')},
  {id: '4', name: "Shark Rober", percentage: 1.45, graph: require('../../Assets/Graphs/big-positive-graph-2.png'), avatar: require('../../Assets/Images/MahkyMahk.png')},
  {id: '5', name: "Clark Rober", percentage: 5.45, graph: require('../../Assets/Graphs/big-positive-graph-2.png'), avatar: require('../../Assets/Images/MahkyMahk.png')},
  {id: '6', name: "Bark Rober", percentage: 100.45, graph: require('../../Assets/Graphs/big-positive-graph-2.png'), avatar: require('../../Assets/Images/MahkyMahk.png')},
  ];

const MiniWatchlist = ({}:any) => {
  return (
  <View style={styles.shadowContainer}>
    <FlatList 
      data={watchlistData}
      renderItem={({ item }) => (
      <View style={styles.container}>
        <View style={styles.miniWatchlist}>
          <Image source={item.avatar} style={styles.stockAvatar} />
          <View style = {styles.textContainer}>
            <Text style={styles.stockText}>{item.name}</Text>
            <Text style={[styles.stockPercentage, 
              item.percentage >= 0 ? styles.positive : styles.negative]}
              >{item.percentage}%</Text>
          </View>
        </View>
        <Image source={item.graph} style={styles.graph} />
      </View>
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
  miniWatchlist: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  textContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  stockAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  stockText: {
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  stockPercentage: {
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    color: '#E53935',
    marginTop: 5,
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
    height: 95,
    width:160,
  },
});

export default MiniWatchlist;
