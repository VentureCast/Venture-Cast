import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
// import { Icon } from 'react-native-elements';
import { RadioButton } from 'react-native-paper';

const LanguageSelectionScreen = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');

  const languages = {
    suggested: ['English (US)', 'English (UK)'],
    otherLanguages: ['Mandarin', 'Spanish', 'French', 'Arabic', 'Russian', 'Indonesian']
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        {/* <Icon name="arrow-back" type="material" color="#333" size={28} /> */}
        <Text style={styles.headerTitle}>Language</Text>
      </View>

      {/* Suggested Languages */}
      <View style={styles.languageSection}>
        <Text style={styles.sectionTitle}>Suggested</Text>
        {languages.suggested.map((language) => (
          <TouchableOpacity
            key={language}
            style={styles.languageItem}
            onPress={() => setSelectedLanguage(language)}
          >
            <Text style={styles.languageText}>{language}</Text>
            <RadioButton
              value={language}
              status={selectedLanguage === language ? 'checked' : 'unchecked'}
              onPress={() => setSelectedLanguage(language)}
              color="#605DEC"
              uncheckedColor="#605DEC"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Other Languages */}
      <View style={styles.languageSection}>
        <Text style={styles.sectionTitle}>Language</Text>
        {languages.otherLanguages.map((language) => (
          <TouchableOpacity
            key={language}
            style={styles.languageItem}
            onPress={() => setSelectedLanguage(language)}
          >
            <Text style={styles.languageText}>{language}</Text>
            <RadioButton
              value={language}
              status={selectedLanguage === language ? 'checked' : 'unchecked'}
              onPress={() => setSelectedLanguage(language)}
              color="#605DEC"
              uncheckedColor="#605DEC"
            />
          </TouchableOpacity>
        ))}
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
  languageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
});

export default LanguageSelectionScreen;
