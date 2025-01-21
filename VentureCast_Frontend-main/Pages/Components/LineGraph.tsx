// components/LineGraph.tsx
//this appears only on the homepage (as of now)
import React from 'react';
import { View, Text,StyleSheet, ImageBackground } from 'react-native';

const LineGraph = ({ background }:any) => {

  return (
      <ImageBackground source={background}>
      <View style={styles.lineGraph}>
        {/* You can implement a real graph using react-native-svg or similar libraries */}
        <Text style={styles.text}>Graph goes here</Text>
      </View>
      </ImageBackground>
  );
};

// session 2:
//  then duplicate it for the next stock section

const styles = StyleSheet.create({
  lineGraph: {
    height: 300,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    color: 'white',
    fontSize: 48,
  },
});

export default LineGraph;
