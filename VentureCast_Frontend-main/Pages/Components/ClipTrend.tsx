// components/ClipTrend.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground} from 'react-native';


const ClipTrend = ({ name, image, description}:any) => {
  return (
    <View style={styles.container}>
      <ImageBackground source={image} style={styles.image}>
        <View style={styles.textContainer}>
          <Text style={styles.categoryText}>{name}</Text>
          <Text style={styles.categoryDescription}>{description}</Text>
        </View>
      </ImageBackground>
    </View>
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
});

export default ClipTrend;
