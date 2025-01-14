import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

// Define the custom Text component
const Text = ({ style}) => {
  return (
    <RNText style={[styles.defaultFont, style]}>
    </RNText>
  );
};

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: 'Urbanist-Regular', // Replace with the name of your font
  },
});

export default Text;
