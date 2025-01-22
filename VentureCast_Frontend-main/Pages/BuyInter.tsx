import React, {useState} from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Image, Alert, TextInput } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Dropdown from './Components/Dropdown';

type RootStackParamList = {
  AddPayment: undefined; // create this page
  BuyStock: undefined;
};

const user = {cash: 23087.39, equity:229375.25 };



const BuyInter = () => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  //credit card variables
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');


  const handleSave = () => {
    if (!ticker || !quantity) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    navigation.navigate('BuyStock') // need to go to this page and have calculation prepared from quantity --> global variables
  };

  const formatNumber = (number: number, decimals: number = 2): string => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (number: number, decimals: number = 2): string => {
    return `$${formatNumber(number, decimals)}`;
  };

  return (
    <>
      <View style={styles.padBox}></View>
      <View style={styles.titleBox}>
        <View style = {styles.clipsSubTitle}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Buy Stock</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.acctContainer}>
          <View style={styles.acctRow}>
            <Text style={styles.acctText}>Total Equity</Text>
            <Text style={styles.acctText}>{formatCurrency(user.equity)}</Text>
          </View>
          <View style={styles.acctRow}>
            <Text style={styles.acctText}>Availible Cash</Text>
            <Text style={styles.acctText}>{formatCurrency(user.cash)}</Text>
          </View>
        </View>
        <View style={styles.container}>
          <View style={styles.itemContainer}>
            <Text style={styles.label}>Ticker</Text>
            <TextInput
              style={styles.input}
              //maxLength={10}
              placeholder="DUPT"
              maxLength={4}
              value={ticker}
              onChangeText={(text) => setTicker(text)} // Removes non-digit characters
            />
          </View>
          <View style={styles.itemContainer}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              keyboardType='numeric'
              placeholder="0"
              value={quantity}
              onChangeText={(text) => setQuantity(text.replace(/\D/g, ''))} // Removes non-digit characters
            />
          </View>
          <View style={styles.itemContainer}>
            <Text style={styles.label}>Price Type</Text>
            <Dropdown
              dropOptions={['Market', 'Limit', 'Stop on Quote', 'Stop Limit on Quote']}
              filler='Choose'
            />
          </View>
          <View style={styles.itemContainer}>
            <Text style={styles.label}>Term</Text>
            <Dropdown
              dropOptions={['Good for Day' ]}
              filler='Choose'
            />
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  padBox: {
    height: 60,
    backgroundColor: '#fff', // White background
  },
  titleBox: {
    backgroundColor: '#fff', // White background
  },
  container: {
    flex: 1,
    flexDirection: 'row', // Arrange items in rows
    flexWrap: 'wrap', // Wrap to the next row if needed
    alignItems: 'center', // Center items vertically
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    backgroundColor: '#fff',
  },
  acctContainer: {
    margin: 20,
  },
  acctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  acctText: {
    fontSize: 16,
    fontFamily: 'Urbanist',
    fontWeight: '600',
  },
  itemContainer: {
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: '#fff',
    width: '40%',
    height: 'auto',
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: '600',
    fontFamily: 'urbanist',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    fontFamily: 'urbanist',
    fontWeight: '500',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#351560',
    padding: 15,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
 // header

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
    fontFamily: 'urbanist',
  },
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
  } ,
  clipsSubTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20,
    marginHorizontal: 20,
  },

});

export default BuyInter;
