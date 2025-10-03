// components/MiniStockCard.tsx
// Unified component for both watchlist and positions items
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatCurrency from './formatCurrency';
import { useUser } from '../../UserProvider';
import { supabase } from '../../supabaseClient';
import SimpleLineGraph from './SimpleLineGraph';

type RootStackParamList = {
  StockPage: { streamer_id: string };
};

const defaultAvatars = [
  require('../../Assets/Images/JimmyBeast.png'),
  require('../../Assets/Images/dude-perfect.png'),
  require('../../Assets/Images/MahkyMahk.png'),
  require('../../Assets/Images/pewdiepie.png'),
];

interface StockCardItem {
  id: string;
  streamer_id: string;
  name: string;
  ticker: string;
  price: number;
  percentage: number;
  priceHistory: number[];
  avatar: any;
  equityValue: number;
}

interface MiniStockCardProps {
  type: 'watchlist' | 'positions';
}

const MiniStockCard = ({ type }: MiniStockCardProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const [data, setData] = useState<any[]>([]);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [streamerStats, setStreamerStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      let fetchedData: any[] = [];
      let streamerIds: string[] = [];

      if (type === 'positions') {
        // Fetch holdings for positions
        const { data: holdingsData, error: holdingsError } = await supabase
          .from('Holdings')
          .select('*')
          .eq('user_id', user.id);
        
        if (holdingsError || !holdingsData) {
          setData([]);
          setStreamers([]);
          setStreamerStats([]);
          return;
        }
        fetchedData = holdingsData;
        streamerIds = [...new Set(holdingsData.map(h => h.streamer_id))];
      } else {
        // Fetch watchlist for watchlist
        const { data: watchlistData, error: watchlistError } = await supabase
          .from('Watchlists')
          .select('streamer_id')
          .eq('user_id', user.id);
        
        if (watchlistError || !watchlistData) {
          setData([]);
          setStreamers([]);
          setStreamerStats([]);
          return;
        }
        fetchedData = watchlistData;
        streamerIds = watchlistData.map(w => w.streamer_id);
      }

      setData(fetchedData);

      if (streamerIds.length === 0) {
        setStreamers([]);
        setStreamerStats([]);
        return;
      }

      // Fetch streamers (ticker_name, profile_picture_path)
      const { data: streamersData } = await supabase
        .from('Streamers')
        .select('streamer_id, ticker_name, profile_picture_path')
        .in('streamer_id', streamerIds);
      setStreamers(streamersData || []);

      // Fetch streamer display names from StreamerInfo
      const { data: infoData } = await supabase
        .from('StreamerInfo')
        .select('streamer_id, name')
        .in('streamer_id', streamerIds);
      const nameMap = Object.fromEntries((infoData || []).map((i: any) => [i.streamer_id, i.name]));
      setStreamers((prev: any[]) => (prev || []).map(s => ({ ...s, username: nameMap[s.streamer_id] || s.username })));

      // Fetch streamer prices
      const { data: statsData } = await supabase
        .from('StreamerPrice')
        .select('streamer_id, current_price, day_1_price, day_2_price, day_3_price, day_4_price, day_5_price, day_6_price, day_7_price')
        .in('streamer_id', streamerIds);
      setStreamerStats(statsData || []);
    };
    fetchData();
  }, [user, type]);

  const streamerMap = useMemo(() => {
    return Object.fromEntries(streamers.map(s => [s.streamer_id, s]));
  }, [streamers]);

  const statsMap = useMemo(() => {
    return Object.fromEntries(streamerStats.map(s => [s.streamer_id, s]));
  }, [streamerStats]);

  // Build stock data for display
  const stockCardData = useMemo(() => {
    return data.map((item, idx) => {
      const streamer = streamerMap[item.streamer_id] || {};
      const stats = statsMap[item.streamer_id] || {};
      const price = stats.current_price || 100.00;
      const day7Price = stats.day_7_price || 100.00;
      const shares = type === 'positions' ? (item.shares_owned || 0) : 0;
      const trendPercent = Number(((price / day7Price) - 1) * 100).toFixed(2);
      
      // Prepare price history data for the graph
      const priceHistory = [
        stats.day_7_price,
        stats.day_6_price,
        stats.day_5_price,
        stats.day_4_price,
        stats.day_3_price,
        stats.day_2_price,
        stats.day_1_price,
        stats.current_price,
      ].map(x => (x !== undefined && x !== null ? Number(x) : Number(price) || 100.00));
      
      const avatar = streamer.profile_picture_path
        ? { uri: streamer.profile_picture_path }
        : defaultAvatars[idx % defaultAvatars.length];

      return {
        id: type === 'positions' ? (item.portfolio_id || idx) : item.streamer_id,
        streamer_id: item.streamer_id,
        name: streamer.ticker_name || 'DUMMY',
        ticker: streamer.ticker_name || 'DUMMY',
        price: price,
        percentage: Number(trendPercent),
        priceHistory,
        avatar,
        equityValue: price * shares,
      };
    })
    // Sort by equity value descending for positions, by name for watchlist
    .sort((a, b) => type === 'positions' ? b.equityValue - a.equityValue : a.name.localeCompare(b.name));
  }, [data, streamerMap, statsMap, type]);

  const formatPercentage = (number: number): string => {
    return `${number.toLocaleString('en-US')}%`;
  };

  return (
    <View style={styles.shadowContainer}>
      <FlatList
        data={stockCardData}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('StockPage', { streamer_id: item.streamer_id })}>
            <View style={styles.container}>
              <View style={styles.miniStockCard}>
                <Image source={item.avatar} style={styles.stockAvatar} />
                <View style={styles.infoContainer}>
                  <View style={styles.textContainer}>
                    <Text style={styles.stockText}>{item.name}</Text>
                    <Text style={styles.stockPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.graphContainer}>
                <SimpleLineGraph data={item.priceHistory} isPositive={item.percentage >= 0} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => String(item.id)}
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
    marginRight: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
    width: 160,
  },
  miniStockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  infoContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    width: 80,
    marginBottom: 5,
    justifyContent: 'center',
  },
  stockAvatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  stockText: {
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },

  stockPrice: {
    fontSize: 16,
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    color: '#212121',
  },
  graphContainer: {
    borderBottomStartRadius: 20,
    borderBottomEndRadius: 20,
    height: 80,
    width: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
});

export default MiniStockCard; 