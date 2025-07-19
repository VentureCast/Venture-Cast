import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';

interface InputFieldProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  keyboardType?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const InputField: React.FC<InputFieldProps> = ({ label, placeholder, value, onChangeText, isPassword, keyboardType, autoCapitalize }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}:</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword}
        keyboardType={keyboardType as any}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 20,
  },
  label: {
    marginBottom: 10,
    color: '#351560',
    fontSize: 18,
    fontFamily: 'urbanist',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    padding: 15,
    fontSize: 18,
    fontFamily: 'urbanist',
  },
});

export default InputField;
