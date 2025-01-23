import React, {useState} from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import TrendBox from './Components/TrendBox';
import ClipsElement from './Components/ClipsElement';
import ClipTrend from './Components/ClipTrend';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  Portfolio: undefined;
  ClipsPage: undefined;
};



const userData = [
  {id: '1', balance: '229,375.25', moneyChange:'66,378.49', percentChange: '24.65' }
]

//category data, should be imported from database

const clipsData = [
  {id: '1', description: 'Most common names in streaming today', name: "Top 50",  image: require('../Assets/Images/Top50.png') },
  {id: '2', description: 'High stakes and big wins', name: "Gambling", image: require('../Assets/Images/Gambling.png')},
  {id: '3', description: 'Where the biggest issues are discussed', name: "Chatting", image: require('../Assets/Images/Chatting.png')},
  {id: '4', description: 'Learn to learn', name: "Education", image: require('../Assets/Images/Education.png') },
  {id: '5', description: 'The tip of the streaming iceberg', name: "Top 10", image: require('../Assets/Images/Top10.png')},
  {id: '6', description: 'All things League', name: "LoL", image: require('../Assets/Images/LoL.png')},
  {id: '7', description: 'Locked into the grindset', name: "Work", image: require('../Assets/Images/Work.png') },
  {id: '8', description: 'Do you even lift BRO?', name: "Excercise", image: require('../Assets/Images/Excercise.png')},
  {id: '9', description: 'The day to day of influentials', name: "Lifestyle", image: require('../Assets/Images/Lifestyle.png')},
  {id: '10', description: 'All the biggest aestetic trends', name: "Design", image: require('../Assets/Images/Design.png')},
  ];



const DiscoverScreen = () => {

  const trendData = [
    {id: '1', name: "All Stocks", icon: require('../Assets/Icons/check.png') },
    {id: '2', name: "Gambling", icon: require('../Assets/Icons/gambling.png')},
    {id: '3', name: "Chatting", icon: require('../Assets/Icons/chatting.png')},
    {id: '4', name: "Cooking", icon: require('../Assets/Icons/burger.png') },
    {id: '5', name: "Lifestyle", icon: require('../Assets/Icons/cool.png')},
    {id: '6', name: "IRL", icon: require('../Assets/Icons/firework.png')},
    {id: '7', name: "Trending", icon: require('../Assets/Icons/TV.png') },
    {id: '8', name: "Electronics", icon: require('../Assets/Icons/monitor.png')},
    {id: '9', name: "Cars", icon: require('../Assets/Icons/car.png')},
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTrendData, setFilteredTrendData] = useState< 
    { id: string; name: string; icon: any }[] >([]); // Define the type explicitly    
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);

// Search handler
const handleSearch = (query: string) => {
  setSearchQuery(query);
  if (query.trim()) {
    const newData = trendData.filter((trend) =>
      trend.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTrendData(newData);
  } else {
    setFilteredTrendData([]); // Clear results when query is empty
  }
};

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
  <>
   {/* balance and header also need to be imported data from user database*/}
      {/* Search Button */}
    <View style={styles.searchBar}>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => setSearchModalVisible(true)}
      >
        <Text style={styles.searchButtonText}>Search...</Text>
        <Image style={styles.rightArrow} source={require('../Assets/Icons/Search.png')} />
      </TouchableOpacity>
    </View>
      {/* Search Modal */}
      <Modal
        visible={isSearchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSearchModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>

            {/* Results */}
            <FlatList
              data={filteredTrendData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TrendBox name={item.name} icon={item.icon} />
              )}
              ListEmptyComponent={
                searchQuery ? (
                  <Text style={styles.noResultsText}>No results found</Text>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
    <ScrollView style={styles.container}>
      <View style={styles.categoriesContainer}>
      {trendData.map(trend => (
            <TrendBox
              key={trend.id}
              name={trend.name}
              icon={trend.icon}
            />
          ))}
      </View>

      <View style={styles.clipsContainer}>
      {clipsData.map(trend => (
            <ClipTrend
              key={trend.id}
              name={trend.name}
              image={trend.image}
              description={trend.description}
            />
          ))}
      </View>
      
      {/* Clips & News Section -- change the clipitem componet tot he one from portfolio screen, then update portfolio with component */}
      <TouchableOpacity onPress={() => navigation.navigate('ClipsPage')}>
        <View style = {styles.clipsSubTitle}>
              <Text style={styles.sectionTitle}>Clips & News</Text>
          {/* need this to be a button that opens up more clips */}
              <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
        </View>
      </TouchableOpacity>
      <View style={styles.sectionTitle}>
        <ClipsElement 
        title="#InRealLife" 
        subTitle="Trending Hashtag" 
        views={827.5}  
        icon = {require('../Assets/Icons/Play.png')}
        />
      </View>
    </ScrollView>
  </>
  );
};


// notes for second session:
// the deposit funds button to the header component
//

const styles = StyleSheet.create({
  // search bar
searchBar: {
  backgroundColor: 'white',

},
searchButton: {
  margin: 10,
  padding: 10,
  paddingHorizontal: 20,
  backgroundColor: '#351560',
  opacity: 0.6,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: 20,
},
searchButtonText: {
  color: '#FFFFFF',
  fontSize: 24,
  fontWeight: 'bold',
  fontFamily: 'urbanist',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  width: '90%',
  maxHeight: '80%',
  padding: 20,
},
searchInput: {
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 20,
  padding: 10,
  marginBottom: 20,
},
closeButton: {
  padding: 10,
  backgroundColor: '#F75555',
  borderRadius: 20,
  alignItems: 'center',
  marginBottom: 10,
},
closeButtonText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
},
noResultsText: {
  textAlign: 'center',
  color: '#F75555',
  marginTop: 20,
},
 // main page
container: {
  backgroundColor: '#FFFFFF',
  paddingBottom: 20,
},
categoriesContainer: {
  flex: 1,
  flexDirection: 'row', // Arrange items in rows
  flexWrap: 'wrap', // Wrap to the next row if needed
  alignItems: 'center', // Center items vertically
  justifyContent: 'flex-start',
  padding: 20,
},
sectionTitle: {
  alignContent: 'flex-start',
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
  fontFamily: 'Urbanist-Regular',
  },
clipsContainer: {
  flex: 1,
  flexDirection: 'row', // Arrange items in rows
  flexWrap: 'wrap', // Wrap to the next row if needed
  alignItems: 'center', // Center items vertically
  justifyContent: 'flex-start',
  padding: 20,
},
// static header
miniLogo: {
  width: 20, 
  height: 20,
  marginHorizontal: 5,
},
iconsHeaderContainer: {
  flexDirection: 'row',
},
miniTitleContainer: {
  flexDirection: 'row',
},
miniTitle: {
  fontSize: 20,
  marginLeft: 10,
  fontFamily: 'Urbanist-Regular',
  fontWeight: '900',
  color: 'white',
},
miniHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  height: 44,
  padding: 10,
  paddingLeft: 20, 
  backgroundColor: '#351560'
},

  //  SubTitles
subTitle: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
  marginHorizontal: 20,
},
rightArrow: {
  justifyContent: 'flex-end',
},
clipsSubTitle: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
  borderColor: '#EAE7EF',
  borderBottomWidth: 1,
  marginHorizontal: 20,
},

//Watchlist section
sectionWatchlist: {
  paddingHorizontal: 20,
  paddingVertical: 15,
  flexDirection: 'row',
},
});

export default DiscoverScreen;
