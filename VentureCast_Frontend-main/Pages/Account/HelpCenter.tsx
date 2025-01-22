import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// need to implement functionality on this page

export default function HelpCenter({navigation}: any) {
  const [tab, setTab] = useState('FAQ'); // For toggling between FAQ and Contact Us
  const [search, setSearch] = useState('');

  return (
    <ScrollView style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.icon} source={require('../../Assets/Icons/Arrow-Left.png')} />
        </TouchableOpacity>
        <View style={styles.headerTabs}>
          <TouchableOpacity onPress={() => setTab('FAQ')}>
            <Text style={tab === 'FAQ' ? styles.activeTab : styles.inactiveTab}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('Contact')}>
            <Text style={tab === 'Contact' ? styles.activeTab : styles.inactiveTab}>Contact us</Text>
          </TouchableOpacity>
        </View>
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
              placeholder="Your Question..."
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: 20,
  },
  headerTabs: {
    width: 300,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#351560',
    marginRight: 40,
    marginBottom: 20,

  },
  activeTab: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    color: '#351560', // our actual purple color (prev: custom purple color)
  },
  inactiveTab: {
    fontSize: 18,
    color: '#8e8e8e', // Lighter grey for inactive
    fontFamily: 'urbanist',
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
    fontFamily: 'urbanist',
  },
  faqContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'urbanist'
  },
  faqTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  faqTab: {
    backgroundColor: '#351560',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  faqTabText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'urbanist'
  },
  faqList: {
    marginTop: 10,
  },
  faqItem: {
    fontSize: 16,
    fontFamily: 'urbanist',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  faqItemDropdown: {
    fontSize: 18,
    fontFamily: 'urbanist',
    fontWeight: 'bold',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    color: '#4b0082', // Highlight color for dropdown
  },
  icon: { 
    width: 23.5,
    height: 20,
    marginBottom: 20
    },
});
