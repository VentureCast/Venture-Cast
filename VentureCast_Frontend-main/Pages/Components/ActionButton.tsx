// components/ActionButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ActionButton = ({ label, onPress, large }:any) => {
  return (
    <TouchableOpacity
      style={[styles.button, large ? styles.largeButton : styles.smallButton]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#5D2DFD',
    borderRadius: 30,
    paddingVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeButton: {
    marginTop: 30,
  },
  smallButton: {
    marginTop: 20,
    backgroundColor: '#F2F2F2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ActionButton;
