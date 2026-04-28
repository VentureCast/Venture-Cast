import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import WatchListItem from './Components/WatchlistItem';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../UserProvider';
import api from '../services/api';

type RootStackParamList = {
  Discover: undefined;
};

interface WatchListItemType {
  streamer_id: string;
  name: string;
  shortName: string;
  price: number;
  priceChange: number;
  profileImage: any;
}

const WatchListScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, token } = useUser();
  const [watchList, setWatchList] = useState<WatchListItemType[]>([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user?._id || !token) return;

      api.setToken(token);
      try {
        const { watchlist } = await api.getWatchlist();
        const watchlistData = watchlist.map((item) => {
          const price = item.sharePrice ?? 0;
          const day1 = item.day1Price;
          const priceChange =
            day1 != null && day1 > 0
              ? Number((((price / day1) - 1) * 100).toFixed(2))
              : 0;

          return {
            streamer_id: item.streamerId,
            name: item.name,
            shortName: item.ticker,
            price,
            priceChange,
            profileImage: item.profileImageUrl
              ? { uri: item.profileImageUrl }
              : require('../Assets/Images/dude-perfect.png'),
          };
        });

        setWatchList(watchlistData);
      } catch {
        setWatchList([]);
      }
    };

    fetchWatchlist();
  }, [user, token]);

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
            key={item.streamer_id || String(index)}
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
    backgroundColor: '#fff',
    width: '100%',
  },

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

  tempBlock: {
    height: 50,
    width: '100%',
    backgroundColor: '#351560',
  },
});

export default WatchListScreen;
