// components/HeaderLeftStock.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  MainTabs: undefined; // Define your route and parameters here
};

//change the image background to a better image


const HeaderLeftStock = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <View style={styles.miniHeader}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require('../../Assets/Icons/Arrow-Left-White.png')} style={styles.miniLogo} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
        <Image source={require('../../Assets/Icons/VentureCast-Header.png')} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  miniLogo: {
    width: 30, 
    height: 30,
    marginHorizontal: 20,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
});

export default HeaderLeftStock;
