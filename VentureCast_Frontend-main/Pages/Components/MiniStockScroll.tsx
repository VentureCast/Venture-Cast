// components/MiniStockScroll.tsx
// This appears only on the homepage (as of now)
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import formatCurrency from './formatCurrency';
import { useUser } from '../../UserProvider';
import api from '../../services/api';

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
  const { user, token } = useUser();
  const [portfolioData, setPortfolioData] = useState<any>(null);

  useEffect(() => {
    if (user && token) {
      api.setToken(token);
      api.setUserId(user._id);
    }
  }, [user, token]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token) return;
      try {
        const data = await api.getPortfolio(user._id);
        setPortfolioData(data);
      } catch {
        setPortfolioData(null);
      }
    };
    fetchData();
  }, [user, token]);

  const stockScrollData = useMemo(() => {
    if (!portfolioData?.portfolio) return [];
    return portfolioData.portfolio.map((item: any, idx: number) => {
      const gainPercent = Number(item.gainLossPercent || 0);
      const graph = defaultGraphs[idx % defaultGraphs.length];
      const avatar = defaultAvatars[idx % defaultAvatars.length];
      return {
        id: item.streamer?._id || String(idx),
        streamer_id: item.streamer?._id || '',
        name: item.streamer?.name?.substring(0, 4).toUpperCase() || 'N/A',
        ticker: item.streamer?.name?.substring(0, 4).toUpperCase() || 'N/A',
        price: item.currentPrice || 0,
        percentage: gainPercent,
        graph,
        avatar,
        equityValue: item.currentValue || 0,
      };
    })
    .sort((a: any, b: any) => b.equityValue - a.equityValue);
  }, [portfolioData]);

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
            <View style={styles.infoContainer}>
              <View style={styles.textContainer}>
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
