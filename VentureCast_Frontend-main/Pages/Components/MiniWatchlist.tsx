// components/MiniWatchlist.tsx
// This appears only on the homepage (as of now)
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useUser } from '../../UserProvider';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../services/api';

type RootStackParamList = {
  StockPage: { streamer_id: string };
};

const defaultGraph = require('../../Assets/Graphs/big-positive-graph-1.png');
const defaultNegGraph = require('../../Assets/Graphs/big-negative-graph-1.png');
const defaultAvatar = require('../../Assets/Images/Billy-Eyelash.png');

interface WatchlistItem {
  id: string;
  streamerId: string;
  name: string;
  ticker: string;
  percentage: number;
  graph: any;
  avatar: any;
}

const MiniWatchlist = () => {
  const { user, token } = useUser();
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (user && token) {
      api.setToken(token);
      api.setUserId(user._id);
    }
  }, [user, token]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user || !token) {
        setWatchlistData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getWatchlist();
        if (data.watchlist && data.watchlist.length > 0) {
          const transformedData: WatchlistItem[] = data.watchlist.map((item, index) => {
            // Calculate day-over-day percentage change
            const currentPrice = item.sharePrice || 0;
            const previousPrice = item.day1Price || currentPrice;
            const percentage = previousPrice > 0
              ? ((currentPrice - previousPrice) / previousPrice) * 100
              : 0;

            return {
              id: item._id,
              streamerId: item.streamerId,
              name: item.name,
              ticker: item.ticker,
              percentage,
              graph: percentage >= 0 ? defaultGraph : defaultNegGraph,
              avatar: defaultAvatar,
            };
          });
          setWatchlistData(transformedData);
        } else {
          setWatchlistData([]);
        }
      } catch {
        setWatchlistData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, token]);

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
          <TouchableOpacity onPress={() => navigation.navigate('StockPage', { streamer_id: item.streamerId })}>
            <View style={styles.container}>
              <View style={styles.miniWatchlist}>
                <Image source={item.avatar} style={styles.stockAvatar} />
                <View style={styles.textContainer}>
                  <Text style={styles.stockText}>{item.ticker}</Text>
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
