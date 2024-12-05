import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, StatusBar } from 'react-native';
// import { Icon } from 'react-native-elements';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    positionUp: true,
    positionDown: false,
    marketMovers: true,
    newIpo: true,
    depositComplete: true,
    withdrawComplete: false,
    balanceBelowMargin: true,
    appUpdates: false,
    shortPosition: true,
  });

  const toggleSwitch = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        {/* <Icon name="arrow-back" type="material" color="#333" size={28} /> */}
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Notification Items */}
      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>Position is up 10%</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.positionUp ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('positionUp')}
          value={notifications.positionUp}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>Position is down 10%</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.positionDown ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('positionDown')}
          value={notifications.positionDown}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>Top Market Movers</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.marketMovers ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('marketMovers')}
          value={notifications.marketMovers}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>New IPO</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.newIpo ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('newIpo')}
          value={notifications.newIpo}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>Deposit is Complete</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.depositComplete ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('depositComplete')}
          value={notifications.depositComplete}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>Withdraw is Complete</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.withdrawComplete ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('withdrawComplete')}
          value={notifications.withdrawComplete}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>Balance is Below Maintenance Margin</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.balanceBelowMargin ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('balanceBelowMargin')}
          value={notifications.balanceBelowMargin}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>App Updates</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.appUpdates ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('appUpdates')}
          value={notifications.appUpdates}
          style={styles.switch}
        />
      </View>

      <View style={styles.notificationItem}>
        <Text style={styles.notificationText}>Short position has been liquidated</Text>
        <Switch
          trackColor={{ false: '#e5e5e5', true: '#605DEC' }}
          thumbColor={notifications.shortPosition ? '#fff' : '#f4f3f4'}
          onValueChange={() => toggleSwitch('shortPosition')}
          value={notifications.shortPosition}
          style={styles.switch}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexWrap: 'wrap', // Allow text to wrap if necessary
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
    flex: 1, // This ensures the text takes available space before wrapping
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], // Reduce switch size
  },
});

export default NotificationSettings;
