import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';


const MarketStat = ({icon, title, description}:any) => {

  return (
    <View style={styles.optionsContainer}>
        <View style={styles.itemContainer}>
          <View style={styles.leftContainer}>
            <Image source={icon} style={styles.icon} />
            <View>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>
    </View>

  );
};

const styles = StyleSheet.create({
    optionsContainer: {
    paddingHorizontal: 20,
    }, 
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderColor: '#ccc',
      justifyContent: 'space-between',
    },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      width: 60,
      height: 60,
      marginRight: 10,
    },
    title: {
      fontFamily: 'Urbanist',
      fontWeight: 'bold',
      fontSize: 18,
    },
    description: {
      fontFamily: 'Urbanist',
      fontSize: 18,
      fontWeight: 'bold',
    },
});

export default MarketStat;
