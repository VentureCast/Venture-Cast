import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const UploadGovernmentIDScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get the image URI from route params
  const { imageUri }:any = route.params;

  // Handle the Continue button
  const handleContinue = () => {
    navigation.navigate('IdWithSelf'); // Replace 'NextPage' with your actual next screen route
  };

  // Handle the Change button to retake the photo
  const handleRetake = () => {
    navigation.navigate('ScanScreen'); // Navigate back to the CameraScreen to retake photo
  };

  return (
    <ScrollView>
        <View style={styles.container}>
      <Text style={styles.title}>Upload a photo of your Government ID</Text>
      <Text style={styles.subtitle}>
        Regulations require you to upload a national identity card. Don't worry, your data will stay safe and private.
      </Text>

      {/* Display the captured photo */}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.idCardImage} />}
      <Text style={{ padding: 80 }}>
        Your Id Will be displayed here
      </Text>

      {/* Buttons */}
      <TouchableOpacity style={styles.changeButton} onPress={handleRetake}>
        <Text style={styles.buttonText}>Change</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  idCardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  changeButton: {
    backgroundColor: '#EAE7EF',
    padding: 15,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#351560',
    padding: 15,
    borderRadius: 30,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadGovernmentIDScreen;
