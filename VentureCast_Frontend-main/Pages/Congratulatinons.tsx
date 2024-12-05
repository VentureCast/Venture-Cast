import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BuyOrderReceivedScreen = () => {
  const navigation = useNavigation();

  const handleViewPortfolio = () => {
    // Navigate to the portfolio screen
    navigation.navigate('Portfolio'); // Replace with the actual portfolio screen route
  };

  const handleBackToDUPT = () => {
    // Navigate back to DUPT details or previous screen
    navigation.navigate('DUPT'); // Replace with the actual DUPT screen route
  };

  return (
    <View style={styles.container}>
      {/* Stock Information */}
      <View style={styles.stockInfoContainer}>
        <Image
          source={require('../Assets/Images/dude-perfect.png')} // Replace with your logo URL
          style={styles.stockLogo}
        />
        <Text style={styles.stockName}>Dude Perfect</Text>
        <Text style={styles.stockSymbol}>DUPT</Text>
        <Image source={require('../Assets/Images/Congratulations.png')}/>
      </View>

      {/* Order Confirmation */}
      <View style={styles.orderConfirmationContainer}>
        <Image
          source={{ uri: 'https://your-image-url.com/celebration-icon.png' }} // Replace with your celebration icon URL
          style={styles.celebrationIcon}
        />
        <Text style={styles.amountText}>$10,000</Text>
        <Text style={styles.orderText}>Buy Order Received!</Text>
        <Text style={styles.descriptionText}>
          Your order has been received and will be executed as soon as possible
        </Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.portfolioButton} onPress={handleViewPortfolio}>
        <Text style={styles.buttonText}>View My Portfolio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={handleBackToDUPT}>
        <Text style={styles.backButtonText}>Back to DUPT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockInfoContainer: {
    alignItems: 'center',
  },
  stockLogo: {
    width: 50,
    height: 50,
    borderRadius: 40,
    marginBottom: 10,
  },
  stockName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  stockSymbol: {
    fontSize: 16,
    color: '#888',
  },
  orderConfirmationContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8A51BA', // Purple color for the amount
    marginTop: -60
  },
  orderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
    marginBottom: 20,
  },
  portfolioButton: {
    backgroundColor: '#351560', // Deep purple color for "View My Portfolio" button
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#EAE7EF', // Light color for "Back to DUPT" button
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#351560', // Text color for "Back to DUPT" button
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BuyOrderReceivedScreen;
