import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import WatchListItem from './Components/WatchlistItem';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

type RootStackParamList = {
  Discover: undefined; // Do this for all linked pages
};

interface WatchListItemType {
  name: string;
  shortName: string;
  price: number;
  priceChange: number;
  profileImage: any;
}

const WatchListScreen = ( ) => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [watchList, setWatchList] = useState<WatchListItemType[]>([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      // Fetch all streamers in the user's watchlist
      const { data, error } = await supabase
        .from('Watchlists')
        .select(`streamer_id, Streamers (username, ticker_name, profile_picture_path)`);
      if (!error && data) {
        setWatchList(data.map(item => {
          const streamer = Array.isArray(item.Streamers) ? item.Streamers[0] : item.Streamers;
          return {
            name: streamer?.username || 'Unknown',
            shortName: streamer?.ticker_name || '',
            price: 0, // TODO: Add price if needed
            priceChange: 0, // TODO: Add priceChange if needed
            profileImage: streamer?.profile_picture_path ? { uri: streamer.profile_picture_path } : require('../Assets/Images/dude-perfect.png'),
          };
        }));
      } else {
        setWatchList([]);
      }
    };
    fetchWatchlist();
  }, []);

  return (
    <>
      <View style={styles.padBox}></View>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRowLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>My Watchlist</Text>
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
