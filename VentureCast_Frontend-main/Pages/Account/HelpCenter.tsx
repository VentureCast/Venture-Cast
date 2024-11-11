import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function HelpCenter() {
  const [tab, setTab] = useState('FAQ'); // For toggling between FAQ and Contact Us
  const [search, setSearch] = useState('');

  return (
    <ScrollView style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.headerTabs}>
        <TouchableOpacity onPress={() => setTab('FAQ')}>
          <Text style={tab === 'FAQ' ? styles.activeTab : styles.inactiveTab}>FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('Contact')}>
          <Text style={tab === 'Contact' ? styles.activeTab : styles.inactiveTab}>Contact us</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Section */}
      {tab === 'Contact' && (
        <View style={styles.contactContainer}>
          <TouchableOpacity style={styles.contactItem}>
            {/* <MaterialCommunityIcons name="headset" size={24} color="black" /> */}
            <Text style={styles.contactText}>Customer Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem}>
            {/* <MaterialCommunityIcons name="web" size={24} color="black" /> */}
            <Text style={styles.contactText}>Website</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem}>
            {/* <Icon name="facebook" size={24} color="black" /> */}
            <Text style={styles.contactText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem}>
            {/* <Icon name="twitter" size={24} color="black" /> */}
            <Text style={styles.contactText}>Twitter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem}>
            {/* <Icon name="instagram" size={24} color="black" /> */}
            <Text style={styles.contactText}>Instagram</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAQ Section */}
      {tab === 'FAQ' && (
        <View style={styles.faqContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Why I..."
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity>
              {/* <Icon name="search" size={20} color="black" /> */}
            </TouchableOpacity>
          </View>
          <View style={styles.faqTabs}>
            <TouchableOpacity style={styles.faqTab}>
              <Text style={styles.faqTabText}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.faqTab}>
              <Text style={styles.faqTabText}>Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.faqTab}>
              <Text style={styles.faqTabText}>Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.faqTab}>
              <Text style={styles.faqTabText}>Stocks</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.faqList}>
            <Text style={styles.faqItem}>Why can I not buy stock?</Text>
            <Text style={styles.faqItem}>Why can I not sell stock?</Text>
            <Text style={styles.faqItem}>Why has my short position been liquidated?</Text>
            <Text style={styles.faqItem}>Why can I not add a payment method?</Text>
            <TouchableOpacity>
              <Text style={styles.faqItemDropdown}>How to buy stock on Venture Cast?</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerTabs: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  activeTab: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b0082', // Custom purple color
    borderBottomWidth: 2,
    borderBottomColor: '#4b0082',
  },
  inactiveTab: {
    fontSize: 18,
    color: '#8e8e8e', // Lighter grey for inactive
  },
  contactContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  contactText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'black',
  },
  faqContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  faqTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  faqTab: {
    backgroundColor: '#4b0082',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  faqTabText: {
    color: 'white',
    fontSize: 14,
  },
  faqList: {
    marginTop: 10,
  },
  faqItem: {
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  faqItemDropdown: {
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    color: '#4b0082', // Highlight color for dropdown
  },
});
