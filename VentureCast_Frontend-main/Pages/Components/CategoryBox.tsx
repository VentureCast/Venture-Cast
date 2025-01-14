// components/CategoryBox.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const CategoryBox = ({ name, percentage, graph}:any) => {
  return (
    <View style={styles.categoryBox}>
      <View style={styles.categoryBoxText}>
        <Text style={styles.categoryText}>{name}</Text>
        <Text style={[styles.categoryPercentage, percentage >= 0 ? styles.positive : styles.negative]}>({percentage}%)</Text>
      </View>
     <Image style = {styles.graph} source={graph} />
    </View>
  );
};

const styles = StyleSheet.create({
  categoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderColor: '#F5F5F5',
    borderWidth: 1,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  categoryBoxText:{
    marginLeft: 10,
  },
  categoryText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
  },
  categoryPercentage: {
    fontSize: 14,
    marginTop: 5,
  },
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
  },
  graph: {
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20,
    marginTop:5,
    height: 75,
    width: 120,
  },
});

export default CategoryBox;
