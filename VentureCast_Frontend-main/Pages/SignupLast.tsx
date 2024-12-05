import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, CheckBox, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TermsAndConditionsScreen = () => {
  const navigation = useNavigation();
  const [isChecked, setIsChecked] = useState(false);

  const handleContinue = () => {
    if (isChecked) {
      navigation.navigate('NextScreen'); // Replace with actual route
    } else {
      alert('Please agree to the terms and conditions before continuing.');
    }
  };

  const handleTermsLink = () => {
    Linking.openURL('https://example.com/terms'); // Replace with the actual link
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        By checking the box, you agree to our terms and conditions
      </Text>

      <Text style={styles.link} onPress={handleTermsLink}>
        Terms and Conditions (Link)
      </Text>

      <View style={styles.checkboxContainer}>
        <CheckBox
          value={isChecked}
          onValueChange={setIsChecked}
          style={styles.checkbox}
        />
        <Text style={styles.description}>
          I have read, understood and agree to be bound by all terms, disclosures, certifications, and disclaimers applicable to me, as found in the{' '}
          <Text style={styles.legalLink} onPress={handleTermsLink}>
            legal terms
          </Text>{' '}
          of the VentureCast application.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.continueButton, isChecked ? styles.activeButton : styles.inactiveButton]}
        onPress={handleContinue}
        disabled={!isChecked}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 20,
  },
  link: {
    fontSize: 16,
    color: '#8A51BA', // purple link
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  checkbox: {
    alignSelf: 'center',
    marginRight: 10,
  },
  description: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  legalLink: {
    color: '#8A51BA',
    textDecorationLine: 'underline',
  },
  continueButton: {
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#351560',
  },
  inactiveButton: {
    backgroundColor: '#EAE7EF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TermsAndConditionsScreen;
function alert(arg0: string) {
    throw new Error('Function not implemented.');
}

