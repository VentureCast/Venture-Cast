// components/MiniStockScroll.tsx
//this appears only on the homepage (as of now)
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatCurrency from './formatCurrency';
import { useUser } from '../../UserProvider';
import { supabase } from '../../supabaseClient';

type RootStackParamList = {
  StockPage: undefined;
};

const defaultGraphs = [
  require('../../Assets/Graphs/Mega-Nega-1.png'),
  require('../../Assets/Graphs/Mega-Posi-1.png'),
  require('../../Assets/Graphs/big-positive-graph-2.png'),
];
const defaultAvatars = [
  require('../../Assets/Images/JimmyBeast.png'),
  require('../../Assets/Images/dude-perfect.png'),
  require('../../Assets/Images/MahkyMahk.png'),
  require('../../Assets/Images/pewdiepie.png'),
];

const MiniStockScroll = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [streamerStats, setStreamerStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      // Fetch holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('Holdings')
        .select('*')
        .eq('user_id', user.id);
      if (holdingsError || !holdingsData) {
        setHoldings([]);
        setStreamers([]);
        setStreamerStats([]);
        return;
      }
      setHoldings(holdingsData);
      const streamerIds = [...new Set(holdingsData.map(h => h.streamer_id))];
      if (streamerIds.length === 0) {
        setStreamers([]);
        setStreamerStats([]);
        return;
      }
      // Fetch streamers
      const { data: streamersData } = await supabase
        .from('Streamers')
        .select('streamer_id, username, ticker_name')
        .in('streamer_id', streamerIds);
      setStreamers(streamersData || []);
      // Fetch streamer stats
      const { data: statsData } = await supabase
        .from('StreamerStats')
        .select('streamer_id, current_price')
        .in('streamer_id', streamerIds);
      setStreamerStats(statsData || []);
    };
    fetchData();
  }, [user]);

  const streamerMap = useMemo(() => {
    return Object.fromEntries(streamers.map(s => [s.streamer_id, s]));
  }, [streamers]);
  const statsMap = useMemo(() => {
    return Object.fromEntries(streamerStats.map(s => [s.streamer_id, s]));
  }, [streamerStats]);

  // Build stock data for display
  const stockScrollData = useMemo(() => {
    return holdings.map((h, idx) => {
      const streamer = streamerMap[h.streamer_id] || {};
      const stats = statsMap[h.streamer_id] || {};
      const price = stats.current_price || 100.00;
      const averageCost = h.average_cost || 100.00;
      const shares = h.shares_owned || 0;
      const trendPercent = Number(((price / averageCost) - 1) * 100).toFixed(2);
      // Use dummy graph and avatar, cycle through defaults
      const graph = defaultGraphs[idx % defaultGraphs.length];
      const avatar = defaultAvatars[idx % defaultAvatars.length];
      return {
        id: h.portfolio_id || idx,
        name: streamer.ticker_name || 'DUMMY',
        ticker: streamer.ticker_name || 'DUMMY',
        price: price,
        percentage: Number(trendPercent),
        graph,
        avatar,
        equityValue: price * shares,
      };
    })
    // Sort by equity value descending
    .sort((a, b) => b.equityValue - a.equityValue);
    // Show all positions (no slice)
  }, [holdings, streamerMap, statsMap]);

  const formatPercentage = (number: number): string => {
    return `${number.toLocaleString('en-US')}%`;
  };

  return (
  <View style={styles.shadowContainer}>
    <FlatList
      data={stockScrollData}
      renderItem={({ item }) => (
      <TouchableOpacity onPress={() => navigation.navigate('StockPage')}>
        <View style={styles.container}>
          <View style={styles.miniStockScroll}>
            <Image source={item.avatar} style={styles.stockAvatar} />
            <View style = {styles.infoContainer}>
              <View style = {styles.textContainer}>
                <Text style={styles.stockText}>{item.name}</Text>
              </View>
              <View style={styles.numberContainer}>
                <Text style={[styles.stockPercentage, 
                item.percentage >= 0 ? styles.positive : styles.negative]}
                >{formatPercentage(item.percentage)}</Text>
                <Text style={styles.stockPrice}>{formatCurrency(item.price)}</Text>
              </View>
            </View>
          </View>
          <Image source={item.graph} style={styles.graph} />
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
  miniStockScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  infoContainer: {
    marginLeft: 10,
  },
  textContainer: {
    flexDirection: 'column',
    width: 130,
    marginBottom: 5,
  },
  stockAvatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  stockText: {
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  stockTicker: {
    fontFamily: 'Urbanist',
    fontWeight: '500',
    fontSize: 9.55,
    color: '#757575',
    marginTop: 5,
  },
  numberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockPrice: {
    justifyContent: 'flex-end',
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    color: '#212121',
  },
  stockPercentage: {
    fontSize: 12,
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    color: '#E53935',
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
    height: 80,
    width: 200,
  },
});

export default MiniStockScroll;
