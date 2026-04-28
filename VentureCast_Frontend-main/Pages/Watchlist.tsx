import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import WatchListItem from './Components/WatchlistItem';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserProvider';

type RootStackParamList = {
  Discover: undefined; // Do this for all linked pages
};

interface WatchListItemType {
  streamer_id: string;
  name: string;
  shortName: string;
  price: number;
  priceChange: number;
  profileImage: any;
}

const WatchListScreen = ( ) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const [watchList, setWatchList] = useState<WatchListItemType[]>([]);
  const [streamerStats, setStreamerStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return;
      
      // Fetch all streamers in the user's watchlist
      const { data, error } = await supabase
        .from('Watchlists')
        .select(`streamer_id, Streamers (ticker_name, profile_picture_path), StreamerInfo:streamer_id (name)`) 
        .eq('user_id', user.id);
      
      if (!error && data) {
        const watchlistData = data.map(item => {
          const streamer = Array.isArray(item.Streamers) ? item.Streamers[0] : item.Streamers;
          const info = Array.isArray(item.StreamerInfo) ? item.StreamerInfo[0] : item.StreamerInfo;
          return {
            streamer_id: item.streamer_id,
            name: info?.name || 'Unknown',
            shortName: streamer?.ticker_name || '',
            price: 0, // Will be updated with stats
            priceChange: 0, // Will be updated with stats
            profileImage: streamer?.profile_picture_path ? { uri: streamer.profile_picture_path } : require('../Assets/Images/dude-perfect.png'),
          };
        });
        
        setWatchList(watchlistData);
        
        // Fetch streamer stats for price data
        const streamerIds = watchlistData.map(item => item.streamer_id);
        if (streamerIds.length > 0) {
          const { data: statsData } = await supabase
            .from('StreamerPrice')
            .select('streamer_id, current_price, day_1_price')
            .in('streamer_id', streamerIds);
          setStreamerStats(statsData || []);
        }
      } else {
        setWatchList([]);
      }
    };
    fetchWatchlist();
  }, [user]);

  // Process watchlist data with stats
  const processedWatchlist = useMemo(() => {
    const statsMap = Object.fromEntries(streamerStats.map(s => [s.streamer_id, s]));
    
    return watchList.map(item => {
      const stats = statsMap[item.streamer_id] || {};
      const price = stats.current_price || 100.00;
      const day1Price = stats.day_1_price || 100.00;
      const priceChange = Number(((price / day1Price) - 1) * 100).toFixed(2);
      
      return {
        ...item,
        price: price,
        priceChange: Number(priceChange),
      };
    });
  }, [watchList, streamerStats]);

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
        {processedWatchlist.map((item, index) => (
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
