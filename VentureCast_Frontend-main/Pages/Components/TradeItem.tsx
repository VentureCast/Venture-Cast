import React from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TradeItem = ({icon, title, description, page}:any) => {
  const navigation = useNavigation();

  return (
    <View style={styles.optionsContainer}>
      <TouchableOpacity onPress={() => navigation.navigate(page)} // idk if this will work-- ofc it did dumbass
        >
        <View style={styles.itemContainer}>
          <View style={styles.leftContainer}>
            <Image source={icon} style={styles.icon} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </View>
          <Image source={require('../../Assets/Icons/Arrow-right-2.png')} style={styles.arrow} />
        </View>
      </TouchableOpacity>
    </View>

  );
};

const styles = StyleSheet.create({
// notif title and back arrow
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Urbanist',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 20,
      justifyContent: 'space-between',
    },
    optionsContainer: {

    }, 
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 20,
      marginLeft: 20,
      marginRight: 40,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderColor: '#ccc',
    },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    arrow: {
    },
    icon: {
      width: 60,
      height: 60,
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
      paddingRight: 30,
      alignContent: 'center',
    },
    title: {
      fontFamily: 'Urbanist',
      fontWeight: 'bold',
      fontSize: 18,
    },
    description: {
      fontFamily: 'Urbanist',
      fontSize: 14,
      fontWeight: 300,
      marginTop: 10,
      color: '#555',
    },
});

export default TradeItem;
