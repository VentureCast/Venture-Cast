// components/MiniStockCard.tsx
// Unified component for both watchlist and positions items
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatCurrency from './formatCurrency';
import { useUser } from '../../UserProvider';
import api from '../../services/api';
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

function buildPriceHistory(
  shareInfo: Awaited<ReturnType<typeof api.getShareInfo>> | null,
  fallbackPrice: number
): number[] {
  if (!shareInfo?.priceHistory) {
    return Array(8).fill(fallbackPrice || 100);
  }
  const h = shareInfo.priceHistory;
  const seq = [
    h.day7,
    h.day6,
    h.day5,
    h.day4,
    h.day3,
    h.day2,
    h.day1,
    shareInfo.sharePrice,
  ];
  return seq.map((x) =>
    x != null && !Number.isNaN(Number(x)) ? Number(x) : fallbackPrice || 100
  );
}

function trendVsDay7(
  shareInfo: Awaited<ReturnType<typeof api.getShareInfo>> | null,
  currentPrice: number
): number {
  const d7 = shareInfo?.priceHistory?.day7;
  if (d7 == null || d7 === 0) return 0;
  return Number((((currentPrice / d7) - 1) * 100).toFixed(2));
}

const MiniStockCard = ({ type }: MiniStockCardProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, token } = useUser();
  const [stockCardData, setStockCardData] = useState<StockCardItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!user?._id || !token) {
        setStockCardData([]);
        return;
      }

      api.setToken(token);

      try {
        if (type === 'watchlist') {
          const { watchlist } = await api.getWatchlist();
          const infos = await Promise.all(
            watchlist.map((w) =>
              api.getShareInfo(w.streamerId).catch(() => null)
            )
          );
          if (cancelled) return;

          const cards: StockCardItem[] = watchlist.map((w, idx) => {
            const info = infos[idx];
            const price = w.sharePrice ?? 0;
            const percentage = trendVsDay7(info, price);
            const priceHistory = buildPriceHistory(info, price);
            const avatar = w.profileImageUrl
              ? { uri: w.profileImageUrl }
              : defaultAvatars[idx % defaultAvatars.length];

            return {
              id: w.streamerId,
              streamer_id: w.streamerId,
              name: w.name,
              ticker: w.ticker,
              price,
              percentage,
              priceHistory,
              avatar,
              equityValue: 0,
            };
          });

          setStockCardData(
            cards.sort((a, b) => a.name.localeCompare(b.name))
          );
        } else {
          const { portfolio } = await api.getPortfolio(user._id);
          const infos = await Promise.all(
            portfolio.map((p) =>
              api.getShareInfo(String(p.streamer._id)).catch(() => null)
            )
          );
          if (cancelled) return;

          const cards: StockCardItem[] = portfolio.map((p, idx) => {
            const info = infos[idx];
            const streamer = p.streamer as {
              _id: string;
              name?: string;
              ticker?: string;
            };
            const sid = String(streamer._id);
            const price = p.currentPrice ?? 0;
            const percentage = trendVsDay7(info, price);
            const priceHistory = buildPriceHistory(info, price);
            const avatar = defaultAvatars[idx % defaultAvatars.length];

            return {
              id: sid,
              streamer_id: sid,
              name: streamer.name || 'Unknown',
              ticker:
                streamer.ticker ||
                (streamer.name || 'NA').substring(0, 4).toUpperCase(),
              price,
              percentage,
              priceHistory,
              avatar,
              equityValue: p.currentValue ?? 0,
            };
          });

          setStockCardData(
            cards.sort((a, b) => b.equityValue - a.equityValue)
          );
        }
      } catch (e) {
        console.error('MiniStockCard fetch error', e);
        if (!cancelled) setStockCardData([]);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user, token, type]);

  return (
    <View style={styles.shadowContainer}>
      <FlatList
        data={stockCardData}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('StockPage', { streamer_id: item.streamer_id })
            }
          >
            <View style={styles.container}>
              <View style={styles.miniStockCard}>
                <Image source={item.avatar} style={styles.stockAvatar} />
                <View style={styles.infoContainer}>
                  <View style={styles.textContainer}>
                    <Text style={styles.stockText}>{item.name}</Text>
                    <Text style={styles.stockPrice}>
                      {formatCurrency(item.price)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.graphContainer}>
                <SimpleLineGraph
                  data={item.priceHistory}
                  isPositive={item.percentage >= 0}
                />
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
