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
import { ScrollView } from 'react-native-gesture-handler';


// need the button to actually change the language

const LanguageButton = () => {
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
          <Text style={styles.buttonText}>Language</Text> 
        </TouchableOpacity>

        {/* Modal for navigation options */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select a language</Text>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.optionText}>English (US)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Spanish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>French</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Chinese</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Japanese</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>German</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Swedish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Norwegian</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Finnish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Russian</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Swedish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Italian</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Greek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Portugese</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Arabic</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Gaelic</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Dutch</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </Modal>
      </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 60,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  buttonText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    fontFamily: 'urbanist',
  },
});

export default LanguageButton;
