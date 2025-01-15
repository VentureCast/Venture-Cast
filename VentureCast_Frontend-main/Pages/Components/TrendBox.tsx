// components/TrendBox.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const TrendBox = ({ name, icon}:any) => {
  return (
    <View style={styles.categoryBox}>
        <Image style = {styles.icon} source={icon} />
        <Text style={styles.categoryText}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderColor: '#F5F5F5',
    borderWidth: 1,
    padding: 10,
    alignItems: 'flex-start',
    marginRight: 10,
    marginVertical: 5,
  },
  categoryText: {
    fontSize: 16,
    color: '#212121',
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
  },
  icon: {
    marginRight:5,
    height: 20,
    width: 20,
  },
});

export default TrendBox;
