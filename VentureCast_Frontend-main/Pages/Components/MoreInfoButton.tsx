import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MoreInfoButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleNavigation = (screen:any) => {
    setModalVisible(false);
    navigation.navigate(screen);
  };

  return (
    <View>
      {/* Image acting as a button */}
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image
          source={require('../../Assets/Icons/more-info.png')}
          style={styles.icon}
        />
      </TouchableOpacity>

      {/* Modal for navigation options */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>More</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleNavigation('Notifications')}
            >
              <Text style={styles.optionText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleNavigation('Activity')}
            >
              <Text style={styles.optionText}>Transaction Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleNavigation('SettingsScreen')}
            >
              <Text style={styles.optionText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Urbanist',
    fontSize: 20,
    color:'#351560',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: '#351560',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginVertical: 5,
  },
  optionText: {
    fontFamily: 'Urbanist',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    fontFamily: 'Urbanist',
    color: '#F75555',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    width: 25, 
    height: 25,
    marginHorizontal: 5,
  },
});

export default MoreInfoButton;
