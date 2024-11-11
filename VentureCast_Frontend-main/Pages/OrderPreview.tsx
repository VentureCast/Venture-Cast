import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PreviewBuyScreen = () => {
  const navigation = useNavigation();

  const handleBuyNow = () => {
    // Add navigation or action for "Buy Now"
    navigation.navigate('Congratulations'); // Replace with the actual next screen route
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Preview Buy</Text>
      </View>

      {/* Stock Information */}
      <View style={styles.stockInfoContainer}>
        <Image
          source={{ uri: 'https://your-logo-url.com/dude-perfect-logo.png' }} // Replace with your logo URL
          style={styles.stockLogo}
        />
        <View>
          <Text style={styles.stockName}>Dude Perfect</Text>
          <Text style={styles.stockSymbol}>DUPT</Text>
        </View>
        <Text style={styles.buyInText}>Buy in Dollars</Text>
      </View>

      {/* Pricing Information */}
      <View style={styles.pricingInfoContainer}>
        <View style={styles.pricingRow}>
          <Text style={styles.label}>Market Price</Text>
          <Text style={styles.value}>$71.10</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.label}>Number of Shares</Text>
          <Text style={styles.value}>0.013659756</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.label}>Market Ask</Text>
          <Text style={styles.value}>$71.30</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.label}>Bid-Ask Spread</Text>
          <Text style={styles.value}>$0.20</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalValue}>$10,050.00</Text>
        </View>
      </View>

      {/* Buy Now Button */}
      <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  stockInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stockLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  stockName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  stockSymbol: {
    fontSize: 14,
    color: '#888',
  },
  buyInText: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#888',
  },
  pricingInfoContainer: {
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#888',
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8A51BA', // Total cost color
  },
  buyButton: {
    backgroundColor: '#351560', // Button color
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default PreviewBuyScreen;
