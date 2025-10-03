// components/MiniWatchlist.tsx
//this appears only on the homepage (as of now)
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabaseClient';
import { useUser } from '../../UserProvider';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: { streamer_id: string };
};

// Default data for fallback
const defaultPercentage = '2.50';
const defaultGraph = require('../../Assets/Graphs/big-positive-graph-1.png');
const defaultAvatar = require('../../Assets/Images/Billy-Eyelash.png');

interface WatchlistItem {
  id: string;
  name: string;
  percentage: number;
  graph: any;
  avatar: any;
}

const MiniWatchlist = () => {
  const { user } = useUser();
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) {
        setWatchlistData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch watchlist data with streamer information
        const { data, error } = await supabase
          .from('Watchlists')
          .select(`
            streamer_id,
            Streamers (
              streamer_id,
              username,
              ticker_name,
              profile_picture_path
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching watchlist:', error);
          setWatchlistData([]);
        } else if (data && data.length > 0) {
          // Transform the data to match the expected format
          const transformedData: WatchlistItem[] = data.map((item: any, index: number) => {
            const streamer = Array.isArray(item.Streamers) ? item.Streamers[0] : item.Streamers;
            return {
              id: item.streamer_id || `item-${index}`,
              name: streamer?.ticker_name || 'Unknown',
              percentage: Math.random() * 20 - 10, // Random percentage between -10 and 10 for demo
              graph: Math.random() > 0.5 ? 
                require('../../Assets/Graphs/big-positive-graph-1.png') : 
                require('../../Assets/Graphs/big-negative-graph-1.png'),
              avatar: streamer?.profile_picture_path ? { uri: streamer.profile_picture_path } : defaultAvatar
            };
          });
          
          setWatchlistData(transformedData);
        } else {
          setWatchlistData([]);
        }
      } catch (error) {
        console.error('Error in fetchWatchlist:', error);
        setWatchlistData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.shadowContainer}>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Loading watchlist...</Text>
        </View>
      </View>
    );
  }

  if (watchlistData.length === 0) {
    return (
      <View style={styles.shadowContainer}>
        <View style={styles.container}>
          <Text style={styles.emptyText}>No items in watchlist</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shadowContainer}>
      <FlatList 
        data={watchlistData}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('StockPage', { streamer_id: item.id })}>
            <View style={styles.container}>
              <View style={styles.miniWatchlist}>
                <Image source={item.avatar} style={styles.stockAvatar} />
                <View style={styles.textContainer}>
                  <Text style={styles.stockText}>{item.name}</Text>
                  <Text style={[styles.stockPercentage, 
                    item.percentage >= 0 ? styles.positive : styles.negative]}
                  >
                    {item.percentage.toFixed(2)}%
                  </Text>
                </View>
              </View>
              <Image source={item.graph} style={styles.graph} />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
      />
    </View>
  );
};

// session 2:
//  then duplicate it for the next stock section

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 20,
    shadowColor: '#351560', 
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  container: {
    flexDirection: 'column',
    borderRadius: 20,
    borderWidth: 0.1,
    borderColor: '#351560',
    marginRight: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
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
    width: 160,
  },
  loadingText: {
    fontFamily: 'Urbanist',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Urbanist',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export default MiniWatchlist;
