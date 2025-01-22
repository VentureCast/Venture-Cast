import React, {useState} from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Image, Alert, TextInput } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  AddPayment: undefined; // create this page
};



const AddPayment = () => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  //credit card variables
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSave = () => {
    if (!cardNumber || !cvv || !name || !expiryDate) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (cardNumber.length !== 16 || cvv.length !== 3) {
      Alert.alert('Error', 'Invalid card number or CVV.');
      return;
    }
    Alert.alert('Success', 'Credit card details saved!');
  };

  return (
    <>
      <View style={styles.padBox}></View>
      <View style={styles.titleBox}>
        <View style = {styles.clipsSubTitle}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image style={styles.leftArrow} source={require('../Assets/Icons/Arrow-Left.png')} />
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Add a payment method</Text>
        </View>
      </View>
      <View style={styles.container}>
      <Text style={styles.label}>Card Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={16}
        placeholder="1234 5678 9012 3456"
        value={cardNumber}
        onChangeText={(text) => setCardNumber(text.replace(/\D/g, ''))} // Removes non-digit characters
      />

      <Text style={styles.label}>CVV</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={3}
        placeholder="123"
        value={cvv}
        onChangeText={(text) => setCvv(text.replace(/\D/g, ''))} // Removes non-digit characters
      />

      <Text style={styles.label}>Name on Card</Text>
      <TextInput
        style={styles.input}
        placeholder="First Last"
        value={name}
        onChangeText={(text) => setName(text)}
      />

      <Text style={styles.label}>Expiry Date (MM/YY)</Text>
      <TextInput
        style={styles.input}
        placeholder="MM/YY"
        value={expiryDate}
        onChangeText={(text) => setExpiryDate(text.replace(/[^0-9/]/g, ''))} // Removes invalid characters
        maxLength={5}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Details</Text>
      </TouchableOpacity>
    </View>
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
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: '600',
    fontFamily: 'urbanist',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#FFF',
    fontFamily: 'urbanist',
  },
  button: {
    backgroundColor: '#351560',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Urbanist-Regular',
    paddingBottom: 10,
    },
  leftArrow: {
    marginRight: 20,
    marginTop: 4, // bad method to line up the arrow
    width: 23.75,
    height: 20,
  },
  clipsSubTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: 20,
    marginHorizontal: 20,
  },

});

export default AddPayment;
