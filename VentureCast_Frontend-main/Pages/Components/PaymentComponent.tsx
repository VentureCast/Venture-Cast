import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  page: undefined; // Do this for all linked pages
};

const PaymentComponent = ({icon, title, page}:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.optionsContainer}>
      <TouchableOpacity onPress={() => navigation.navigate(page)} //  need card details page
        >
        <View style={styles.itemContainer}>
          <View style={styles.leftContainer}>
            <Image source={icon} style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <View>
            <Text style={styles.connected}>Connected</Text> 
          </View>
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
      flex: 1,
      alignItems: 'center',
      margin: 20,
    },
    optionsContainer: {
    }, 
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 20,
      marginHorizontal: 20,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderColor: '#ccc',
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
    connected: {
      fontFamily: 'urbanist',
      fontWeight: 'bold',
      color: '#351560',
      fontSize: 18,
    },
});

export default PaymentComponent;
