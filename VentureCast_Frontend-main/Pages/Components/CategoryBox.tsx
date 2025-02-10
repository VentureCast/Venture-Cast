// components/CategoryBox.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const CategoryBox = ({ name, percentage, graph}:any) => {
  return (
    <View style={styles.categoryBox}>
      <View style={styles.categoryBoxText}>
        <Text style={styles.categoryText}>{name}</Text>
        <Text style={[styles.categoryPercentage, percentage >= 0 ? styles.positive : styles.negative]}>{percentage}%</Text>
      </View>
     <Image style = {styles.graph} source={graph} />
    </View>
  );
};

const styles = StyleSheet.create({
  categoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderColor: '#351560',
    borderWidth: 0.1,
    paddingTop: 10,
    alignItems: 'flex-start',
    shadowColor: '#351560', 
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 }, // Moves shadow downward
    shadowRadius: 0.5,
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
