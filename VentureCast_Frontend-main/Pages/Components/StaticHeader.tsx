// components/StaticHeader.tsx
import React from 'react';
import { View, Text, ImageBackground, Image} from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Or any icon library


//change the image background to a better image

const arrowUp = require('../../Assets/Icons/Arrow-Up-White.png');
const arrowDown = require('../../Assets/Icons/Arrow-Down-White.png');

const StaticHeader = ({rightIconOne, rightIconTwo }:any) => {
  return (
    <ImageBackground source={require('../../Assets/Images/portfolio-background.png')}>
    <View style={styles.miniHeader}>
    <View style={styles.miniTitleContainer}>
      <Image source={require('../../Assets/Images/Frame.png')} style={styles.miniLogo} />
       {/* need to link this to the home page */}
      <Text style={styles.miniTitle}>VENTURECAST</Text>
    </View>
    <View style={styles.iconsHeaderContainer}>
      <Image source={rightIconOne} style={styles.icon} />
      <Image source={rightIconTwo} style={styles.icon} />
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
