import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const SimpleLineGraph = ({ data, isPositive }: { data: number[], isPositive: boolean }) => {
  // Robust data validation and transformation
  const processData = (inputData: number[]): number[] => {
    if (!Array.isArray(inputData)) {
      console.warn('SimpleLineGraph: data is not an array, using default values');
      return Array(8).fill(0);
    }

    // Convert all values to numbers and handle invalid values
    let processedData = inputData.map((value, index) => {
      const num = Number(value);
      if (isNaN(num) || !isFinite(num)) {
        console.warn(`SimpleLineGraph: Invalid value at index ${index}: ${value}, using 0`);
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
    
    return processedData;
  };

  const chartData = processData(data);

  // Calculate min and max for better Y-axis scaling
  const minValue = Math.min(...chartData);
  const maxValue = Math.max(...chartData);
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding

  // Generate empty labels for clean look
  const generateEmptyLabels = () => {
    return ['', '', '', '', '', '', '', ''];
  };

  return (
    <View style={{ 
      alignItems: 'center', 
      width: '100%',
      backgroundColor: 'transparent'
    }}>
      <LineChart
        data={{
          labels: generateEmptyLabels(),
          datasets: [
            {
              data: chartData,
              color: () => isPositive ? '#12D18E' : '#F75555', // Green for positive, red for negative
              strokeWidth: 3,
            },
          ],
        }}
        width={190}
        height={80}
        yAxisLabel={''}
        yAxisSuffix={''}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(53, 21, 96, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { 
            borderRadius: 12,
            paddingRight: 0,
            paddingLeft: 0,
          },
          propsForDots: {
            r: '0',
            strokeWidth: '0',
            stroke: 'transparent',
            fill: 'transparent',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: 'rgba(53, 21, 96, 0.05)',
            strokeWidth: 0.3,
          },

        }}
        style={{
          borderRadius: 12,
          paddingRight: 0,
          paddingLeft: 0,
          marginLeft: 20,
        }}
        fromZero={false}
        withShadow={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        segments={2}
      />
    </View>
  );
};

export default SimpleLineGraph; 