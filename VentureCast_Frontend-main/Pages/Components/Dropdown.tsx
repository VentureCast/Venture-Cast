import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';

const Dropdown = ({dropOptions, filler}:any) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState(filler);

  const handleSelect = (item: string) => {
    setSelectedValue(item);
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <Text style={styles.dropdownText}>{selectedValue}</Text>
      </TouchableOpacity>

      <Modal visible={isVisible} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsVisible(false)}
        />
        <View style={styles.dropdownContainer}>
          <FlatList
            data={dropOptions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  dropdownButton: {
    borderColor: '#351560',
    width: '100%',
    borderWidth: 3,
    borderRadius: 20,
    justifyContent: 'center',
    padding: 10,
  },
  dropdownText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'urbanist',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
  },
  dropdownItem: {
    justifyContent: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Urbanist-Regular',
  },
});

export default Dropdown;
