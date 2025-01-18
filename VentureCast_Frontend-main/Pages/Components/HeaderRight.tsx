// components/HeaderRight.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MoreInfoButton from './MoreInfoButton';



//change the image background to a better image


const HeaderRight = () => {
  const navigation = useNavigation();
  return (
<View style={styles.iconsHeaderContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('Watchlist')}> 
        <Image source={require('../../Assets/Icons/Heart.png')} style={styles.icon} />
      </TouchableOpacity>
      <MoreInfoButton />
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 25, 
    height: 25,
    marginRight: 10,
  },
  iconsHeaderContainer: {
    flexDirection: 'row',
    paddingRight:10, 
  },
});

export default HeaderRight;
