import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, NavigationProp, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

type RootStackParamList = {
  Orders: undefined; // Do this for all linked pages
  Portfolio: undefined;
  ClipsPage: undefined;
  StockDetails: { streamer_id: string } | undefined;
};

const StockDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'StockDetails'>>();
  const streamerId = route.params?.streamer_id;

  const [streamer, setStreamer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!streamerId) return;
      setLoading(true);
      // Fetch streamer info
      const { data: streamerData } = await supabase
        .from('Streamers')
        .select('streamer_id, username, ticker_name, profile_picture_path')
        .eq('streamer_id', streamerId)
        .single();
      setStreamer(streamerData);
      // Fetch streamer stats
      const { data: statsData } = await supabase
        .from('StreamerStats')
        .select('streamer_id, current_price, day_1_price')
        .eq('streamer_id', streamerId)
        .single();
      setStats(statsData);
      setLoading(false);
    };
    fetchData();
  }, [streamerId]);

  const price = stats?.current_price || 100.00;
  const day1Price = stats?.day_1_price || 100.00;
  const trendPercent = useMemo(() => {
    if (!day1Price) return '0.00';
    return (((price / day1Price) - 1) * 100).toFixed(2);
  }, [price, day1Price]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>VENTURE CAST</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Text style={styles.heartIcon}>♡</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.shareIcon}>⇪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView style={styles.scrollContent}>
        {/* Stock Information */}
        <View style={styles.stockInfo}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' }}
            style={styles.stockImage}
          />
          <View style={styles.stockDetails}>
            <Text style={styles.stockName}>{streamer?.ticker_name || 'TICKER'}</Text>
            <Text style={styles.stockTicker}>{streamer?.username || streamerId}</Text>
          </View>
          <View style={styles.stockPriceInfo}>
            <Text style={styles.lastCloseText}>Last close</Text>
            <Text style={styles.stockPrice}>${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Graph */}
        <View style={styles.graphContainer}>
          <Text style={styles.graphPlaceholder}>Graph will be shown here</Text>
        </View>

        {/* Stock Performance */}
        <View style={styles.performanceContainer}>
          <Text style={styles.performancePrice}>${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.performanceChange}>
            {Number(trendPercent) >= 0 ? '+' : ''}{trendPercent}%
          </Text>
          <Text style={styles.lastCloseLabel}>Last close</Text>
        </View>

        {/* My Position Section */}
        <View style={styles.positionContainer}>
          <Text style={styles.positionTitle}>My PDP Position</Text>
          <View style={styles.positionRow}>
            <View style={styles.positionInfo}>
              <Text>Shares</Text>
            </View>
            <View style={styles.positionInfo}>
              <Text>Avg. Cost</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buy/Sell Buttons - Fixed at the Bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.sellButton}>
          <Text style={styles.buttonText}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buttonText} onPress={() => {
            navigation.navigate('Orders');
          }}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2fff3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#27d98e',
  },
  backButton: {
    fontSize: 18,
    color: '#fff',
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  heartIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 15,
  },
  shareIcon: {
    fontSize: 20,
    color: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#27d98e',
  },
  stockImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  stockDetails: {
    marginLeft: 10,
  },
  stockName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  stockTicker: {
    fontSize: 14,
    color: '#fff',
  },
  stockPriceInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  lastCloseText: {
    fontSize: 12,
    color: '#fff',
  },
  stockPrice: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  graphContainer: {
    backgroundColor: '#e6faf1',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  graphPlaceholder: {
    fontSize: 16,
    color: '#888',
  },
  performanceContainer: {
    padding: 20,
    backgroundColor: '#f2fff3',
    alignItems: 'center',
  },
  performancePrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  performanceChange: {
    fontSize: 16,
    color: '#27d98e',
  },
  percentageChange: {
    color: '#27d98e',
  },
  lastCloseLabel: {
    fontSize: 12,
    color: '#888',
  },
  positionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f2fff3',
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  positionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    position: 'absolute',  // Fix the button container
    bottom: 0,  // Stick to the bottom of the screen
    left: 0,
    right: 0,
  },
  sellButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    marginRight: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#27d98e',
    paddingVertical: 15,
    marginLeft: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StockDetailsScreen;
