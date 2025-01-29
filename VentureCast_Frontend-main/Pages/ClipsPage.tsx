import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image, FlatList } from 'react-native';
import NewsItem from './Components/NewsItem';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  StockDetails: undefined;
  stock: undefined;
};

export default function ClipsPage() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [tab, setTab] = useState('Clips'); // For toggling between Clips and News


  return (
    <>
      <ScrollView style={styles.container}>

        {/* Back button header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Back</Text>
        </View>

        {/* Tabs */}
        <View style={styles.subHeader}>
          <View style={styles.headerTabs}>
            <TouchableOpacity onPress={() => setTab('Clips')}>
              <Text style={tab === 'Clips' ? styles.activeTab : styles.inactiveTab}>Clips</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('News')}>
              <Text style={tab === 'News' ? styles.activeTab : styles.inactiveTab}>News</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tab === 'Clips' && (
        <>
          <View style={styles.recentClips}>
            <View style = {styles.recentClipsTitle}>
              <Text style={styles.sectionTitle}>Recent Viral Clips</Text>
            </View>
            {/* we want each section to pull from a database of clips for the stocks that are presented above the clips */}
            <TouchableOpacity onPress={() => navigation.navigate('StockPage')}>
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
            </TouchableOpacity>
            {/* Replace with real video data */}
            <FlatList
              horizontal
              data={[
                { id: '1', video: 'Clip 1',  image: require('../Assets/Images/Clip1.png')}, 
                { id: '2', video: 'Clip 2', image: require('../Assets/Images/Clip2.png')},
                { id: '3', video: 'Clip 3', image: require('../Assets/Images/Clip3.png')}, 
                { id: '4', video: 'Clip 1',  image: require('../Assets/Images/Clip1.png')}
                ]}
              renderItem={({ item }) => (
                <View style={styles.clipItem}>
                  <Image style={styles.clipImage} source = {item.image} />
                </View>
              )}
              keyExtractor={item => item.id}
            />
          </View>
        </>
        )}

        {tab === 'News' && (
        <>
          <NewsItem
            time= "1 day ago"
            title= 'Forbes'
            headline='Twitch Roundup: PewDiePie Earnings, Katy Perry Earnings, Dude Perfect Earnings, And ...'
          />
          <NewsItem
            time= "2 days ago"
            title= 'Seeking Alpha'
            headline='Own The Poll Booths'
          />
          <NewsItem
            time= "2 days ago"
            title= 'The Motley Fool'
            headline='Kathie Wood Has Abandoned Dude Perfect -- Should You Follow Her Lead?'
          />
        </>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  backgroundImage: {
    marginBottom: 10,
  },
  accountSummary: {
    marginLeft: 20,
  },
  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'urbanist',
  },

  subHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTabs: {
    width: 300,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#351560',
    marginBottom: 20,
  },
  activeTab: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    color: '#351560', // our actual purple color (prev: custom purple color)
  },
  inactiveTab: {
    fontSize: 24,
    color: '#8e8e8e', // Lighter grey for inactive
    fontFamily: 'urbanist',
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
  },

  // news
  clipsSubTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderColor: '#EAE7EF',
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
});

