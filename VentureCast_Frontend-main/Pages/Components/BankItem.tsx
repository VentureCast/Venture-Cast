//./components/BankItem
import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  page: undefined; // Do this for all linked pages
};

const BankItem = ({icon, title, description, page}:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View>
      <TouchableOpacity onPress={() => navigation.navigate(page)} >
        <View style={styles.itemContainer}>
          <View style={styles.leftContainer}>
            <Image source={icon} style={styles.icon} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </View>
          <Image source={require('../../Assets/Icons/Arrow-right-2.png')}/>
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

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 20,
      marginLeft: 20,
      marginRight: 40,
      marginBottom: 10,
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

export default BankItem;
