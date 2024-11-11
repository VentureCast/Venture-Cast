import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Header from './Components/Header';
import CategoryBox from './Components/CategoryBox';
import StockItem from './Components/StockItem';
import ClipItem from './Components/ClipItem';
import ActionButton from './Components/ActionButton';
import StockDetailsScreen from './StockDetails';

const VentureCastHome = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header balance="$229,375.25" change="$66,378.49 (24.65%)" />

      <ActionButton label="Deposit Funds" onPress={() => {}} large={false} />

      {/* Categories Section */}
      <View style={styles.categoriesContainer}>
        <CategoryBox name="Gaming" percentage="+3.57%" color="#4CAF50" />
        <CategoryBox name="Gambling" percentage="-1.96%" color="#E53935" />
        <CategoryBox name="Chatting" percentage="+2.85%" color="#4CAF50" />
      </View>

      {/* Watch List Section */}
      <View style={styles.section}>
        <View >
        <StockItem
          name="MrBeast"
          avatar="https://link-to-avatar.jpg"
          percentage="-1.98%"
          price="$71.05"
        />
        </View>
        <View style={{width: '80%'}}>
        <StockItem
          name="Billie"
          avatar="https://link-to-avatar.jpg"
          percentage="+2.45%"
          price="$71.05"
        />
        </View>
      </View>

      {/* Clips & News Section */}
      <View style={styles.section}>
        <ClipItem title="#InRealLife" subtitle="Trending Hashtag" />
      </View>

      {/* Deposit to Venture Cast Button */}
      <ActionButton label="Deposit to Venture Cast" onPress={() => {}} large={true} />
        <StockDetailsScreen />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
  },
});

export default VentureCastHome;
