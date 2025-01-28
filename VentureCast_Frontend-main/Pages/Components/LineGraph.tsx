import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LineChart } from 'react-native-svg-charts';
import * as shape from 'd3-shape';

const LineGraph = ({ background, data }: { background: any; data: number[] }) => {
  return (
    <ImageBackground source={background} style={styles.background}>
      <View style={styles.lineGraph}>
        <LineChart
          style={styles.chart}
          data={data}
          svg={{ stroke: 'white' }}
          contentInset={{ top: 20, bottom: 20 }}
          curve={shape.curveNatural}
        ></LineChart>
        <Text style={styles.text}>Stock Data</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  lineGraph: {
    height: 300,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  chart: {
    height: 200,
    width: '90%',
  },
  text: {
    color: 'white',
    fontSize: 20,
    marginTop: 10,
  },
});

export default LineGraph;
