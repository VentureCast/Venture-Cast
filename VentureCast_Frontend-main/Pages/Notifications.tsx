import React from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import NotificationItem from './Components/NotificationItem';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  SettingsScreen: undefined; // Do this for all linked pages
};
const NotificationScreen = () => {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const notifications = [
    {
      title: 'Multiple Card Features!',
      day:  1, // need a counter since the notification
      month: 1,
      year: 2025,
      hour: 14,
      minute: 43,
      description: 'Now you can connect VentureCast with multiple MasterCard & Visa.',
      icon: require('../Assets/Icons/CardFeatures.png'), // Example icon
    },
    {
      title: 'New Updates Available!',
      day:  3, // need a counter since the notification
      month: 12,
      year: 2024,
      hour: 12,
      minute: 10, // need to accept less than 10 and display time
      description: 'Update VentureCast to get the latest features and improve your VentureCast experience.',
      icon: require('../Assets/Icons/NewUpdates.png'), // Example icon
    },
    {
      title: 'Account Setup Successful!',
      day:  1, // need a counter since the notification
      month: 16,
      year: 2025,
      hour: 10,
      minute: 34,
      description: 'Your account creation was successful, welcome to VentureCast!',
      icon: require('../Assets/Icons/AccountNotif.png'), // Example icon
    },
  ];

  return (
    <>
      <View style={styles.tempBlock}>

      </View>
      <ScrollView style={styles.container}>
        <View style={styles.titleRow}>
          <View style={styles.titleRowLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image style={styles.icon} source={require('../Assets/Icons/Arrow-Left.png')} />
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View>
            <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
              <Image style={styles.icon} source={require('../Assets/Icons/Setting.png')} />
            </TouchableOpacity>
          </View>
        </View>

        {notifications.map((item, index) => (
          <NotificationItem
            key={index}
            title={item.title}
            day={item.day}
            month={item.month}
            year={item.year}
            minute={item.minute}
            hour={item.hour}
            description={item.description}
            icon={item.icon}
          />
        ))}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
    width: '100%'
  },
  tempBlock: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
  },
// notif title and back arrow
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Urbanist',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      marginTop: 20,
      justifyContent: 'space-between',
    },
    titleRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
  icon: { 
    width: 23.5,
    height: 20,
    marginHorizontal: 20,
    },
});

export default NotificationScreen;
