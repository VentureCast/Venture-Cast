// components/StaticHeader.tsx
import React from 'react';
import { View, Text, ImageBackground, Image, TouchableOpacity, StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Or any icon library
import { useNavigation, NavigationProp } from '@react-navigation/native';
import MoreInfoButton from './MoreInfoButton';

type RootStackParamList = {
  MainTabs: undefined;
  Watchlist: undefined;
};


//change the image background to a better image


const StaticHeader = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <ImageBackground source={require('../../Assets/Images/portfolio-background.png')}>
    <View style={styles.miniHeader}>
    <View style={styles.miniTitleContainer}>
      <Image source={require('../../Assets/Images/Frame.png')} style={styles.miniLogo} />
       {/*  This button links to Home as in the tabs pages, when it is pressed on within 
       a tab page it goes to home page but outside of the tab pages it just returns to the last tab page accessed. */}

      <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
        <Text style={styles.miniTitle}>VENTURECAST</Text>
      </TouchableOpacity>

    </View>
    <View style={styles.iconsHeaderContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('Watchlist')}>
        <Image source={require('../../Assets/Icons/Heart.png')} style={styles.icon} />
      </TouchableOpacity>
      <MoreInfoButton />
    </View>
  </View>
  </ImageBackground>
  );
};

const styles = StyleSheet.create({
  miniLogo: {
    width: 20, 
    height: 20,
    marginHorizontal: 5,
  },
  icon: {
    width: 25, 
    height: 25,
    marginHorizontal: 5,
  },
  iconsHeaderContainer: {
    flexDirection: 'row',
  },
  miniTitleContainer: {
    flexDirection: 'row',
  },
  miniTitle: {
    fontSize: 20,
    marginLeft: 10,
    fontFamily: 'Urbanist-Regular',
    fontWeight: '900',
    color: 'white',
  },
  miniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 44,
    padding: 10,
    paddingLeft: 20, 
    backgroundColor: 'transparent'
  },
});

export default StaticHeader;
