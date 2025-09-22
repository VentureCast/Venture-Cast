// components/MiniStockScroll.tsx
//this appears only on the homepage (as of now)
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
      // Fetch streamers (ticker_name, profile_picture_path)
      const { data: streamersData } = await supabase
        .from('Streamers')
        .select('streamer_id, ticker_name, profile_picture_path')
        .in('streamer_id', streamerIds);
      setStreamers(streamersData || []);
      // Fetch names from StreamerInfo
      const { data: infoData } = await supabase
        .from('StreamerInfo')
        .select('streamer_id, name')
        .in('streamer_id', streamerIds);
      const nameMap = Object.fromEntries((infoData || []).map((i: any) => [i.streamer_id, i.name]));
      setStreamers((prev: any[]) => (prev || []).map(s => ({ ...s, username: nameMap[s.streamer_id] || s.username })));
      // Fetch streamer prices with history for graphs
      const { data: statsData } = await supabase
        .from('StreamerPrice')
        .select('streamer_id, current_price, day_1_price, day_2_price, day_3_price, day_4_price, day_5_price, day_6_price, day_7_price')
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
      const day7Price = stats.day_7_price || 100.00;
      const shares = h.shares_owned || 0;
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
        id: h.portfolio_id || idx,
        streamer_id: h.streamer_id,
        name: streamer.ticker_name || 'DUMMY',
        ticker: streamer.ticker_name || 'DUMMY',
        price: price,
        percentage: Number(trendPercent),
        priceHistory,
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
      <TouchableOpacity onPress={() => navigation.navigate('StockPage', { streamer_id: item.streamer_id })}>
        <View style={styles.container}>
          <View style={styles.miniStockScroll}>
            <Image source={item.avatar} style={styles.stockAvatar} />
            <View style = {styles.infoContainer}>
              <View style = {styles.textContainer}>
                <Text style={styles.stockText}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.stockPrice}>{formatCurrency(item.price)}</Text>
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
    justifyContent: 'space-between',
    padding: 10,
  },
  infoContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    width: 90,
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
  stockTicker: {
    fontFamily: 'Urbanist',
    fontWeight: '500',
    fontSize: 9.55,
    color: '#757575',
    marginTop: 5,
  },
  numberContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  stockPrice: {
    justifyContent: 'flex-end',
    fontSize: 16,
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
  priceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  graphContainer: {
    borderBottomStartRadius: 20,
    borderBottomEndRadius: 20,
    height: 80,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
});

export default MiniStockScroll;
