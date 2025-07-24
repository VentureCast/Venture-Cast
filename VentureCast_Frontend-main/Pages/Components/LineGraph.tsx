import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const LineGraph = ({ data }: { data: number[] }) => {
  // Robust data validation and transformation
  const processData = (inputData: number[]): number[] => {
    if (!Array.isArray(inputData)) {
      console.warn('LineGraph: data is not an array, using default values');
      return Array(8).fill(0);
    }

    // Convert all values to numbers and handle invalid values
    let processedData = inputData.map((value, index) => {
      const num = Number(value);
      if (isNaN(num) || !isFinite(num)) {
        console.warn(`LineGraph: Invalid value at index ${index}: ${value}, using 0`);
        return 0;
      }
      return num;
    });

    // Ensure we have exactly 8 data points
    if (processedData.length < 8) {
      const padding = Array(8 - processedData.length).fill(processedData[0] || 0);
      processedData = [...padding, ...processedData];
    } else if (processedData.length > 8) {
      processedData = processedData.slice(-8);
    }

    // Final validation
    processedData = processedData.map(x => (typeof x === 'number' && isFinite(x) ? x : 0));
    
    console.log('LineGraph processed data:', processedData);
    return processedData;
  };

  const chartData = processData(data);

  // Calculate min and max for better Y-axis scaling
  const minValue = Math.min(...chartData);
  const maxValue = Math.max(...chartData);
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding

  return (
    <View style={{ 
      alignItems: 'center', 
      width: '100%',
      paddingVertical: 10,
      backgroundColor: 'transparent'
    }}>
      <LineChart
        data={{
          labels: ['7', '6', '5', '4', '3', '2', '1', '0'],
          datasets: [
            {
              data: chartData,
              color: () => '#00FF88', // Green color for positive trend
              strokeWidth: 3,
            },
          ],
        }}
        width={screenWidth * 0.9}
        height={200}
        yAxisLabel={'$'}
        yAxisSuffix={''}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: 'transparent',
          backgroundGradientTo: 'transparent',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: { 
            borderRadius: 16,
            paddingRight: 0,
            paddingLeft: 0,
          },
          propsForDots: {
            r: '3',
            strokeWidth: '2',
            stroke: '#00FF88',
            fill: '#351560',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: 'rgba(255, 255, 255, 0.1)',
            strokeWidth: 1,
          },
        }}
        bezier
        style={{ 
          borderRadius: 16,
          paddingRight: 0,
          paddingLeft: 0,
        }}
        fromZero={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        segments={4}
      />
      <Text style={{ 
        color: '#fff', 
        fontSize: 14, 
        marginTop: 8,
        fontWeight: '600',
        opacity: 0.8
      }}>
        Weekly Price Trend
      </Text>
    </View>
  );
};

export default LineGraph;
