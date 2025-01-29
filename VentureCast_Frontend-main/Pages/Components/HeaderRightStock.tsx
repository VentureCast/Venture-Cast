// components/HeaderRightStock.tsx
import React, {useState} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import MoreInfoButton from './MoreInfoButton';

const shareData = [
  {id: '1', logo: require('../../Assets/Icons/iMessage.png'), name: 'iMessage' },
  {id: '2', logo: require('../../Assets/Icons/X.png'), name: 'X' },
  {id: '3', logo: require('../../Assets/Icons/Facebook.png'), name: 'Facebook' },
  {id: '4', logo: require('../../Assets/Icons/Instagram.png'), name: 'Instagram' },
  {id: '5', logo: require('../../Assets/Icons/TikTok.png'), name: 'TikTok' },
  {id: '6', logo: require('../../Assets/Icons/YouTube.png'), name: 'YouTube' },
  {id: '7', logo: require('../../Assets/Icons/Twitch.png'), name: 'Twitch' },
  {id: '8', logo: require('../../Assets/Icons/WhatsApp.png'), name: 'WhatsApp' },
]

const ShareItem = ({name, logo}:any) => {

  return (
    <TouchableOpacity>
      <View style={styles.shareItem}>
        <Image source={logo} style={styles.shareLogo} />
        <Text style={styles.shareName}>{name}</Text>
      </View>
    </TouchableOpacity>
  )
}

const HeaderRightStock = () => {

  const [modalVisible, setModalVisible] = useState(false);

  // Handler to toggle modal visibility wtf is this modal for?
  const handleItemPress = () => {
    setModalVisible(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.iconsHeaderContainer}>
        <TouchableOpacity onPress={handleItemPress} >
          <Image source={require('../../Assets/Icons/Share.png')} style={styles.icon} />
        </TouchableOpacity>
        <MoreInfoButton />
      </View>
      
       {/* Modal styled as bottom sheet this is not necessary? but i want the background to fade in and the bottom to swipe up */}
      <Modal
         visible={modalVisible}
         transparent={true}
         animationType='fade'
         onRequestClose={handleCloseModal}
        >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>Share</Text>
          </View>
           
          {/* List of options in the modal */}
          <View style={styles.shareItemContainer}>
            {shareData.map(data => (
            <ShareItem 
              key={data.id}
              logo={data.logo}
              name={data.name}
            />
            ))}
          </View>
 
          <TouchableOpacity style={styles.backButton} onPress={handleCloseModal}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 25, 
    height: 25,
    marginRight: 10,
  },
  iconsHeaderContainer: {
    flexDirection: 'row',
    paddingRight:10, 
  },

  //shareItem
  shareItemContainer: {
    flex: 1,
    flexDirection: 'row', // Arrange items in rows
    flexWrap: 'wrap', // Wrap to the next row if needed
    alignItems: 'center', // Center items vertically
    justifyContent: 'space-between',
    padding: 10,
  },
  shareItem: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 10,
  },
  shareLogo: {
    height: 60,
    width: 60,
    marginBottom: 5,
  },
  shareName: {
    fontFamily: 'Urbanist-Regular',
    fontSize: 12,
    fontWeight: 'medium',
    color: '#212121'
  },

  //modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '60%',
  },
  modalTitleContainer: {
    borderBottomWidth: 1,
    borderColor: '#EEE',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'Urbanist-Regular',
  },
  backButton: {
    backgroundColor: '#351560',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
  },
  backText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Urbanist-Regular',
  },
});

export default HeaderRightStock;
