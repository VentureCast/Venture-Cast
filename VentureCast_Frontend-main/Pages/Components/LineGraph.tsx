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

  // Generate date labels
  const generateDateLabels = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return [
      formatDate(weekAgo),  // Left most (7 days ago)
      '', '', '', '', '', '',  // Empty labels for middle points
      formatDate(today)      // Right most (today)
    ];
  };

  return (
    <View style={{ 
      alignItems: 'center', 
      width: '100%',
      paddingVertical: 10,
      paddingHorizontal: 40,
      backgroundColor: 'transparent'
    }}>
      <Text style={{ 
        color: '#000', 
        fontSize: 14, 
        fontWeight: '600',
        marginBottom: 10,
        opacity: 0.8
      }}>
        Weekly Price Trend
      </Text>
      <LineChart
        data={{
          labels: generateDateLabels(),
          datasets: [
            {
              data: chartData,
              color: () => '#351560', // Purple color for trend (matches buy/sell buttons)
              strokeWidth: 3,
            },
          ],
        }}
        width={screenWidth*0.95}
        height={200}
        yAxisLabel={'$'}
        yAxisSuffix={''}
        chartConfig={{
          backgroundColor: '#FFFFFF',
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(53, 21, 96, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { 
            borderRadius: 16,
            paddingRight: 0,
            paddingLeft: 0,
          },
          propsForDots: {
            r: '3',
            strokeWidth: '2',
            stroke: '#351560',
            fill: '#FFFFFF',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: 'rgba(53, 21, 96, 0.2)',
            strokeWidth: 1,
          },
        }}
        style={{ 
          borderRadius: 16,
          paddingRight: 60,
          paddingLeft: 40,
        }}
        fromZero={false}
        withShadow={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        segments={4}
      />
    
    </View>
  );
};

export default LineGraph;
