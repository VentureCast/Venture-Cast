import React, {useState} from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ProfileScreen( { navigation }:any ) {

  const [editState, setEditState] = useState(false);

  const toggleEdit = ({editState}: any) => {
    setEditState((prevState) => ( !prevState ));
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Back</Text>
      </View>

      <View style={styles.profileContainer}>
        {/* TODO: Replace with user's actual profile image if available */}
        <Image 
          source={require('../../Assets/Images/JimmyBeast.png')}
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.editButton} onPress={toggleEdit}>
          <Image source={require('../../Assets/Icons/EditHR.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={ editState ? styles.editInput : styles.input} editable={editState} />
        <Text style={styles.label}>Last Name</Text>
        <TextInput style={ editState ? styles.editInput : styles.input} editable={editState} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={ editState ? styles.editInput : styles.input} editable={editState} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={ editState ? styles.editInput : styles.input} editable={editState} />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput style={ editState ? styles.editInput : styles.input} editable={editState} />

        <Text style={styles.label}>Address</Text>
        <TextInput style={ editState ? styles.editInput : styles.input} editable={editState} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
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
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
    marginRight: 15,
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
  icon: {
    width: 20,
    height: 20,
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
    marginLeft: 5,
    fontFamily: 'Urbanist-Regular'
  },
  input: {
    backgroundColor: '#998fb7',
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#998fb7',
    fontFamily: 'urbanist',
    minWidth: 100,
  },
  editInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#998fb7',
    fontFamily: 'urbanist',
    minWidth: 100,
  },
});
