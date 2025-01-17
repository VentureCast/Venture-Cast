import React from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ProfileScreen( { navigation }:any ) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.backArrow} source={require('../../Assets/Icons/Arrow-Left.png')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Info</Text>
      </View>
      <View style={styles.profileContainer}>
        <Image 
          source={require('../../Assets/Images/JimmyBeast.png')}// Add a real image URL here
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.editButton}>
          {/* You can use an icon here */}
          <Text style={styles.editText}>✎</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value="Alexander Creighton" editable={false} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value="+1 (555) 555-5555" editable={false} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value="acreighton01@joinventurecast.com" editable={false} />

        <Text style={styles.label}>Date of Birth</Text>
        <View style={styles.inputWithIcon}>
          <TextInput style={styles.input} value="01/10/1925" editable={false} />
        </View>

        <Text style={styles.label}>Street Address</Text>
        <TextInput style={styles.input} value="221B Baker Street, London" editable={false} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
    padding: 16,
    paddingTop: 60,
  },
  // header and back arrow
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'urbanist',
  },
  backArrow: { 
    width: 28,
    height: 28,
    marginRight: 20,
    },

  profileContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
  },
  editText: {
    fontSize: 16,
    color: '#000',
  },
  infoSection: {
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'urbanist'
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    fontFamily: 'urbanist'

  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
});
