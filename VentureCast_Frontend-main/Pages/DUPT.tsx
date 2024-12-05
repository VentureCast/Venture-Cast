import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
// import { LineChart } from 'react-native-chart-kit';

const StockDetailsScreen = () => {
  const screenWidth = Dimensions.get('window').width;

  const data = {
    labels: ['Q3 F21', 'Q4', 'Q1 F22', 'Q2', 'Q3'],
    datasets: [
      {
        data: [62.94, 63.46, 65.50, 70.06, 71.05],
        strokeWidth: 2, // Adjust the line thickness
        color: (opacity = 1) => `rgba(138, 81, 186, ${opacity})`, // Purple color line
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Axis label color
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          {/* <Image source={require('./assets/back-arrow.png')} style={styles.backIcon} /> */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VENTURE CAST</Text>
      </View>

      {/* Chart and Stock Information */}
      <View style={styles.stockInfoContainer}>
        <Image source={require('../Assets/Images/dude-perfect.png')} style={styles.stockLogo} />
        <View style={styles.stockDetails}>
          <Text style={styles.stockName}>Dude Perfect</Text>
          <Text style={styles.stockSymbol}>DUPT</Text>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.lastPrice}>$71.05</Text>
          <Text style={styles.priceChange}>+ $2.17 (+2.56%)</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* <LineChart
          data={data}
          width={screenWidth - 40} // Adjust for padding
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
        /> */}
      </View>

      {/* Holdings Section */}
      <View style={styles.holdingsContainer}>
        <Text style={styles.sectionTitle}>My Holdings</Text>
        <View style={styles.holdingsRow}>
          <View style={styles.holdingsColumn}>
            <Text style={styles.holdingLabel}>Shares</Text>
            <Text style={styles.holdingValue}>0.76489</Text>
          </View>
          <View style={styles.holdingsColumn}>
            <Text style={styles.holdingLabel}>Cost</Text>
            <Text style={styles.holdingValue}>$73.86</Text>
          </View>
        </View>
        <View style={styles.holdingsRow}>
          <View style={styles.holdingsColumn}>
            <Text style={styles.holdingLabel}>Equity</Text>
            <Text style={styles.holdingValue}>$22,955.46</Text>
          </View>
          <View style={styles.holdingsColumn}>
            <Text style={styles.holdingLabel}>Total Return</Text>
            <Text style={styles.holdingValue}>+ $4,626.75</Text>
          </View>
        </View>
      </View>

      {/* Market Stats Section */}
      <View style={styles.marketStatsContainer}>
        <Text style={styles.sectionTitle}>DUPT Market Stats</Text>
        <View style={styles.marketStatsRow}>
          <Text style={styles.marketStatLabel}>Market Cap</Text>
          <Text style={styles.marketStatValue}>$12.75B</Text>
        </View>
        <View style={styles.marketStatsRow}>
          <Text style={styles.marketStatLabel}>Shares Outstanding</Text>
          <Text style={styles.marketStatValue}>2,342,121,232</Text>
        </View>
        <View style={styles.marketStatsRow}>
          <Text style={styles.marketStatLabel}>Price-Earnings Ratio</Text>
          <Text style={styles.marketStatValue}>N/A</Text>
        </View>
      </View>

      {/* Expert Opinions Section */}
      <View style={styles.expertsContainer}>
        <Text style={styles.sectionTitle}>What the Experts Say</Text>
        <View style={styles.expertsRow}>
          <View style={styles.expertBarContainer}>
            <View style={styles.buyBar}>
              <Text style={styles.expertBuyText}>70% Buy</Text>
            </View>
            <View style={styles.holdBar}>
              <Text style={styles.expertHoldText}>25% Hold</Text>
            </View>
            <View style={styles.sellBar}>
              <Text style={styles.expertSellText}>5% Sell</Text>
            </View>
          </View>
          <View style={styles.expertStats}>
            <Text style={styles.expertStat}>Target Price: $117.25</Text>
            <Text style={styles.expertStat}>Analyst Return: + 65.20%</Text>
          </View>
        </View>
      </View>

      {/* Viral Clips */}
      <View style={styles.viralClipsContainer}>
        <Text style={styles.sectionTitle}>Recent Viral Clips</Text>
        {/* Add viral clips slider */}
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.sellButton}>
          <Text style={styles.actionButtonText}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.actionButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  stockInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  stockLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  stockDetails: {
    flex: 1,
    marginLeft: 10,
  },
  stockName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  stockSymbol: {
    fontSize: 14,
    color: '#888',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  lastPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  priceChange: {
    fontSize: 16,
    color: '#4CAF50', // Green for positive price change
  },
  chartContainer: {
    marginTop: 20,
  },
  chartStyle: {
    borderRadius: 16,
  },
  holdingsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  holdingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  holdingsColumn: {
    flex: 1,
  },
  holdingLabel: {
    fontSize: 16,
    color: '#666',
  },
  holdingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  marketStatsContainer: {
    marginTop: 20,
  },
  marketStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  marketStatLabel: {
    fontSize: 16,
    color: '#666',
  },
  marketStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  expertsContainer: {
    marginTop: 20,
  },
  expertsRow: {
    marginBottom: 20,
  },
  expertBarContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  buyBar: {
    flex: 7,
    backgroundColor: '#4CAF50', // Green for Buy
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  holdBar: {
    flex: 2.5,
    backgroundColor: '#FFEB3B', // Yellow for Hold
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  sellBar: {
    flex: 0.5,
    backgroundColor: '#F44336', // Red for Sell
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  expertBuyText: {
    fontSize: 14,
    color: '#FFF',
  },
  expertHoldText: {
    fontSize: 14,
    color: '#FFF',
  },
  expertSellText: {
    fontSize: 14,
    color: '#FFF',
  },
  expertStats: {
    marginTop: 10,
  },
  expertStat: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
  viralClipsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sellButton: {
    backgroundColor: '#F44336', // Red for Sell
    padding: 15,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#3F51B5', // Blue for Buy
    padding: 15,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StockDetailsScreen;
