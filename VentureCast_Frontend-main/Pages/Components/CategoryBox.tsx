// components/CategoryBox.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const CategoryBox = ({ name }:any) => {
  return (
    <View style={styles.categoryBox}>
      <Text style={styles.categoryText}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderColor: '#351560',
    borderWidth: 0.1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#351560', 
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 }, // Moves shadow downward
    shadowRadius: 5,
    elevation: 5,
    width: 120,
    height: 80,
  },
  categoryText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CategoryBox;
