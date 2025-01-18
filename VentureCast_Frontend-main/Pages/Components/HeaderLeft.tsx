// components/HeaderLeft.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import { useNavigation } from '@react-navigation/native';


//change the image background to a better image


const HeaderLeft = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.miniHeader}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Image source={require('../../Assets/Images/Frame.png')} style={styles.miniLogo} />
      </TouchableOpacity>
  </View>
  );
};

const styles = StyleSheet.create({
  miniLogo: {
    width: 20, 
    height: 20,
  },
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    height: 44,
    padding: 10,
    paddingLeft: 20, 
    backgroundColor: 'transparent'
  },
});

export default HeaderLeft;
