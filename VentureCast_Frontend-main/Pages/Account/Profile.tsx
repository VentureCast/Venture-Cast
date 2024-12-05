import React from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileContainer}>
        <Image 
          source={{ uri: 'https://example.com/profile.jpg' }} // Add a real image URL here
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.editButton}>
          {/* You can use an icon here */}
          <Text style={styles.editText}>✎</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value="Andrew Ainsley" editable={false} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value="+1 (312) 500-4798" editable={false} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value="andrew.ainsley@yourdomain.com" editable={false} />

        <Text style={styles.label}>Date of Birth</Text>
        <View style={styles.inputWithIcon}>
          <TextInput style={styles.input} value="12/27/1995" editable={false} />
          <TouchableOpacity style={styles.icon}>
            {/* Calendar icon here */}
            <Text style={styles.iconText}>📅</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Street Address</Text>
        <TextInput style={styles.input} value="3517 W. Gray Street, New York" editable={false} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
    padding: 16,
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
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginLeft: -35,
    marginTop: -5,
  },
  iconText: {
    fontSize: 20,
  },
});
