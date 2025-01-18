import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity, ImageBackground } from 'react-native';

import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import { Button } from 'react-native-paper';
import Dropdown from './Components/Dropdown'; // does not do anything but is visible

const ClipsPage = ({ navigation }: any) => {

  // Function to handle stock item press
  const goToStockDetails = (stock: any) => {
    navigation.navigate('StockDetails', { stock });
  };
// do not know where the portfolio header is created or called, want it gone.
//also want the gray bar gone so that the logo and the name hover over the 
  return (
    <>
      <ScrollView style={styles.container}>

        {/* Recent Viral Clips Section */}
        <View style={styles.recentClips}>
          <View style = {styles.recentClipsTitle}>
            <Text style={styles.sectionTitle}>Recent Viral Clips</Text>
         {/* need this to be a button that opens up more clips */}
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
          </View>
          {/* we want each section to pull from a database of clips for the stocks that are presented above the clips */}

          <View  style={styles.clipStockItem}>
            <View style={styles.stockNameLogo}> 
              <Image source={require('../Assets/Images/jake-paul.png')} style={styles.stockLogo} />
              <View>
                <Text style={styles.stockName}>Jake Paul</Text>
                <Text style={styles.stockTicker}>JKPL</Text>
              </View>
            </View>
            <Image source={require('../Assets/Icons/Arrow-right.png')} />
          </View>
          {/* Replace with real video data */}
          <FlatList
            horizontal
            data={
              [{ id: '1', video: 'Clip 1',  image: require('../Assets/Images/Clip1.png')}, 
              { id: '2', video: 'Clip 2', image: require('../Assets/Images/Clip2.png')},
              { id: '3', video: 'Clip 3', image: require('../Assets/Images/Clip3.png')}, 
              ]}
            renderItem={({ item }) => (
              <View style={styles.clipItem}>
                <Image style={styles.clipImage} source = {item.image} />
              </View>
            )}
            keyExtractor={item => item.id}
          />
        </View>
         {/* CLips and News Section */}
         <View style={styles.recentClips}>
          <View style = {styles.recentClipsTitle}>
            <Text style={styles.sectionTitle}>Clips and News</Text>
         {/* need this to be a button that opens up more clips */}
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
          </View>
          {/* we want each section to pull from a database of clips for the stocks that are presented above the clips */}

          <View  style={styles.clipStockItem}>
            <View style={styles.stockNameLogo}> 
              <Image source={require('../Assets/Images/jake-paul.png')} style={styles.stockLogo} />
              <View>
                <Text style={styles.stockName}>Jake Paul</Text>
                <Text style={styles.stockTicker}>JKPL</Text>
              </View>
            </View>
            <Image source={require('../Assets/Icons/Arrow-right.png')} />
          </View>
          {/* Replace with real video data */}
          <FlatList
            horizontal
            data={
              [{ id: '1', video: 'Clip 1',  image: require('../Assets/Images/Clip1.png')}, 
              { id: '2', video: 'Clip 2', image: require('../Assets/Images/Clip2.png')},
              { id: '3', video: 'Clip 3', image: require('../Assets/Images/Clip3.png')}, 
              ]}
            renderItem={({ item }) => (
              <View style={styles.clipItem}>
                <Image style={styles.clipImage} source = {item.image} />
              </View>
            )}
            keyExtractor={item => item.id}
          />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  tempBlock: {
    height: 60,
    width: '100%',
    backgroundColor: '#351560',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    marginBottom: 10,
  },
  accountSummary: {
    marginLeft: 20,
  },

// stock/short list section

  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',
    },

    //stock items
  stockNameLogo: {
    flexDirection: 'row',

  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  stockLogo: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  stockName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Urbanist-Regular',
  },
  stockTicker: {
    color: '#6c757d',
    fontFamily: 'Urbanist-Regular',
  },
 
  // graph; yet to be completed
  lineGraph: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  // recent clips 
  recentClips: {
    marginLeft: 20,
    marginBottom: 20,
    marginRight: 20,
  },
  clipStockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  clipItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 15,
  },
  clipImage: {
    width: 115,
    height:200,
    borderRadius: 12,
  },

  // section title format (with arrow)
  rightArrow: {
    justifyContent: 'flex-end',
  },
  recentClipsTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  // show more button
  showMoreButton: {
    justifyContent: 'center',
  }
});

export default ClipsPage;
