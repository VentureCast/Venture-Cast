import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';

const WatchListItem = ({ profileImage, name, shortName, price, priceChange }:any) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Dummy data to populate the modal list
  const watchListData = [
    { id: 1, name: 'Jake Paul', shortName: 'JKPI', price: 207.47, priceChange: 2.37, profileImage: require('../../Assets/Images/jake-paul.png') },
    { id: 2, name: 'Like Nastya', shortName: 'LKNT', price: 274.52, priceChange: -0.86, profileImage: require('../../Assets/Images/pewdiepie.png') },
    { id: 3, name: 'James Beast Sr.', shortName: 'MBK', price: 95.56, priceChange: -4.25, profileImage: require('../../Assets/Images/JimmyBeast.png') },
    // Add more items here
  ];

  // Handler to toggle modal visibility wtf is this modal for?
  const handleItemPress = () => {
    setModalVisible(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const formatNumber = (number: number, decimals: number = 2): string => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (number: number, decimals: number = 2): string => {
    return `$${formatNumber(number, decimals)}`;
  };

  return (
    <>
      <TouchableOpacity onPress={handleItemPress} style={styles.itemContainer}>
        <Image source={profileImage} style={styles.profileImage} />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.shortName}>{shortName}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatCurrency(price)}</Text>
          <Text style={[styles.priceChange, priceChange >= 0 ? styles.positive : styles.negative]}>
            {priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`}
          </Text>
        </View>
      </TouchableOpacity>

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
          <Text style={styles.modalTitle}>Add to Watch List</Text>
          
          {/* List of options in the modal */}
          <FlatList
            data={watchListData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Image source={item.profileImage} style={styles.modalProfileImage} />
                <View style={styles.modalTextContainer}>
                  <Text style={styles.modalName}>{item.name}</Text>
                  <Text style={styles.modalShortName}>{item.shortName}</Text>
                </View>
                <View style={styles.modalPriceContainer}>
                  <Text style={styles.modalPrice}>{formatCurrency(item.price)}</Text>
                  <Text style={[styles.modalPriceChange, item.priceChange > 0 ? styles.positive : styles.negative]}>
                    {item.priceChange > 0 ? `+${item.priceChange}%` : `${item.priceChange}%`}
                  </Text>
                </View>
              </View>
            )}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleCloseModal}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'urbanist',
  },
  shortName: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'urbanist',
  },
  priceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  price: {
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'urbanist',
  },
  priceChange: {
    marginTop: 5,
    fontSize: 14,
    fontFamily: 'urbanist',
  },
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
  
  // Modal styles
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  modalTextContainer: {
    flex: 1,
  },
  modalName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalShortName: {
    color: '#888',
    fontSize: 14,
  },
  modalPriceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexDirection: 'column'
  },
  modalPrice: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalPriceChange: {
    marginTop: 5,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#351560',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  saveText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WatchListItem;
