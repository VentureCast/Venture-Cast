import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ProvidePhotoScreen = () => {
  const navigation = useNavigation();

  const openCamera = () => {
    navigation.navigate('TermsAndCondition'); // Navigates to the camera screen to take the selfie holding the ID
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Please provide a photo of you holding your Government ID</Text>
      <Text style={styles.subtitle}>
        Make sure your face is clearly visible. Hold your ID card with a selfie.
      </Text>

      {/* Placeholder Image/Icon for visual */}
      <Image
        source={require('../Assets/Images/UploadWithYou.png')} // Add your own placeholder image
        style={styles.imagePlaceholder}
      />

      {/* Open Camera Button */}
      <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
        <Text style={styles.buttonText}>📷 Open Camera</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  backText: {
    fontSize: 24,
    color: '#6a1b9a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  cameraButton: {
    backgroundColor: '#6a1b9a',
    padding: 15,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProvidePhotoScreen;
