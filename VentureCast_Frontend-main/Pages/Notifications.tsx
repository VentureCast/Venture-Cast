import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import NotificationItem from './Components/NotificationItem';

const NotificationScreen = () => {
  const notifications = [
    {
      title: 'Multiple Card Features!',
      time: '1 day ago | 14:43 PM',
      description: 'Now you can connect VentureCast with multiple MasterCard & Visa.',
      icon: require('../Assets/Images/dude-perfect.png'), // Example icon
    },
    {
      title: 'New Updates Available!',
      time: '2 days ago | 10:29 AM',
      description: 'Update VentureCast to get the latest features.',
      icon: require('../Assets/Images/pewdiepie.png'), // Example icon
    },
    {
      title: 'Account Setup Successful!',
      time: '12 Dec, 2022 | 14:27 PM',
      description: 'Your account creation is successful.',
      icon: require('../Assets/Images/jake-paul.png'), // Example icon
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {notifications.map((item, index) => (
        <NotificationItem
          key={index}
          title={item.title}
          time={item.time}
          description={item.description}
          icon={item.icon}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
    width: '100%'
  },
});

export default NotificationScreen;
