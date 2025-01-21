import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  page: undefined; // Do this for all linked pages
};

const NewsItem = ({ time, title, headline}:any) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.newsContainer}> 
      <View style={styles.topContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={styles.headlineContainer}>
        <Text style={styles.headline}>{headline}</Text>
      </View>
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
    newsContainer: {
      margin: 20,
      marginBottom: 0,
      borderBottomWidth: 1,
      paddingBottom: 15,
      borderColor: '#EEEEEE',
    }, 
    topContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    time: {
      fontFamily: 'Urbanist',
      color: '#9E9E9E',
      fontSize: 12,
      fontWeight: '400',
    },
    headlineContainer: {
      flex: 1,
      paddingRight: 30,
      alignContent: 'center',
    },
    title: {
      fontFamily: 'Urbanist',
      fontWeight: '400',
      fontSize: 12,
      color: '#212121'
    },
    headline: {
      fontFamily: 'Urbanist',
      fontSize: 18,
      fontWeight: '700',
      marginTop: 10,
      color: '#212121',
    },
});

export default NewsItem;
