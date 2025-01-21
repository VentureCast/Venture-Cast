// components/HeaderRightStock.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import MoreInfoButton from './MoreInfoButton';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  SharePage: undefined; // Define your route and parameters here
};


//need the share to be a share button like more info button


const HeaderRightStock = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
<View style={styles.iconsHeaderContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('SharePage')}> 
        <Image source={require('../../Assets/Icons/Share.png')} style={styles.icon} />
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

export default HeaderRightStock;
