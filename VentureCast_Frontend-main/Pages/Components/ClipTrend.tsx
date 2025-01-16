// components/ClipTrend.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';



const ClipTrend = ({ name, image, description}:any) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('DiscoverSubPage')} >
      <View style={styles.container}>
        <View style={styles.imageWrapper}>
          <ImageBackground source={image} style={styles.image}>
            <View style={styles.textContainer}>
              <Text style={styles.categoryText}>{name}</Text>
              <Text style={styles.categoryDescription}>{description}</Text>
            </View>
          </ImageBackground>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    flex: 1, 
    justifyContent: 'flex-end', // Align items at the bottom of the container
    //alignItems: 'flex-start', // Center items horizontally
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 21,

  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 5,
    height: 170,
    width: 170,   

  },
  categoryText: {
    fontSize: 16,
    marginHorizontal: 10,
    marginBottom: 10,
    color: 'white',
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
  },
  categoryDescription: {
    fontSize: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    color: 'white',
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 25, // Apply border radius here
    overflow: 'hidden', // Ensures the border radius is respected
  },
});

export default ClipTrend;
