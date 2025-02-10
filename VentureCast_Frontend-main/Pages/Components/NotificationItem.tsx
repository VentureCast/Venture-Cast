import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const NotificationItem = ({ title, day, month, year, hour, minute, description, icon }:any) => {

  return (
    // if date is within 1 day of notif display (in row witgh title): <Image source={require(../Assets/Icons/NewNotif.png)} style={styles.newNotif}/>
    <View style={styles.notificationContainer}>
      <View style={styles.topContainer} >
        <Image source={icon} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.time}>{day}/{month}/{year} | {hour}:{minute}</Text>
        </View>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    flexDirection: 'column',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%'
  },
  topContainer: {
    flexDirection: 'row',

  },
  icon: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
    fontSize: 18,
  },
  time: {
    fontFamily: 'Urbanist',
    color: '#888',
    fontSize: 14,
  },
  description: {
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: 300,
    marginTop: 5,
    color: '#555',
  },
  newNotif: { // needs to be in row with title
    width: 40,
    height: 24,
    alignItems: 'center'
  },
});

export default NotificationItem;
