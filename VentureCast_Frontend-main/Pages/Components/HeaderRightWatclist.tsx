// components/HeaderRightWatchlist.tsx
import React from 'react';
import { View, StyleSheet} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MoreInfoButton from './MoreInfoButton';



//change the image background to a better image


const HeaderRightWatchlist = () => {
  const navigation = useNavigation();
  return (
<View style={styles.iconsHeaderContainer}>
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

export default HeaderRightWatchlist;
