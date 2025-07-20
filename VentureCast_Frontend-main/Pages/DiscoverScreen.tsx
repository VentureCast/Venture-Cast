import React, {useState, useEffect} from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import TrendBox from './Components/TrendBox';
import ClipsElement from './Components/ClipsElement';
import ClipTrend from './Components/ClipTrend';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

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

  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');
      if (error) {
        setCategories([]);
      } else {
        setCategories(data || []);
      }
      setCategoriesLoading(false);
    };
    fetchCategories();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStreamerData, setFilteredStreamerData] = useState<any[]>([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

// Search handler for streamer usernames
const handleSearch = async (query: string) => {
  setSearchQuery(query);
  if (query.trim()) {
    setSearchLoading(true);
    // Fetch matching streamers from Supabase (prefix match)
    const { data, error } = await supabase
      .from('Streamers')
      .select('streamer_id, username, ticker_name')
      .ilike('username', `${query}%`); // Only usernames starting with query
    if (error) {
      setFilteredStreamerData([]);
    } else {
      setFilteredStreamerData(data || []);
    }
    setSearchLoading(false);
  } else {
    setFilteredStreamerData([]); // Clear results when query is empty
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
          <View style={styles.tallModalContent}>
            {/* Close Button above search bar, top right aligned with search bar */}
            <View style={styles.closeButtonAboveRowRightAligned}>
              <TouchableOpacity
                style={styles.closeButtonOvalSmall}
                onPress={() => setSearchModalVisible(false)}
              >
                <Text style={styles.closeButtonOvalTextSmall}>Close</Text>
              </TouchableOpacity>
            </View>
            {/* Search Bar full width */}
            <View style={{ paddingTop: 20, paddingBottom: 20 }}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search streamers..."
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
            {/* Results (scrollable) */}
            {searchLoading ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>Searching...</Text>
            ) : (
              <FlatList
                data={filteredStreamerData}
                keyExtractor={(item) => item.streamer_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchModalVisible(false);
                      navigation.navigate('StockPage', { streamer_id: item.streamer_id });
                    }}
                  >
                    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.username}</Text>
                      <Text style={{ color: '#888' }}>{item.ticker_name}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  searchQuery ? (
                    <Text style={styles.noResultsText}>No results found</Text>
                  ) : null
                }
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>
    <ScrollView style={styles.container}>
      {categoriesLoading ? (
        <View style={{ padding: 20 }}>
          <Text>Loading categories...</Text>
        </View>
      ) : (
        <View style={styles.categoriesContainer}>
          {categories.map(category => (
            <TrendBox
              key={category.id}
              name={category.name}
              icon={require('../Assets/Icons/check.png')} // Placeholder icon
            />
          ))}
        </View>
      )}

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
tallModalContent: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  width: '94%',
  height: '88%', // nearly full height
  marginTop: '6%',
  marginBottom: '6%',
  padding: 20,
  position: 'relative',
},
searchInput: {
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 20,
  padding: 10,
  marginBottom: 20,
},
topRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
},
closeButtonOval: {
  backgroundColor: '#fff',
  borderColor: '#351560',
  borderWidth: 2,
  borderRadius: 20,
  paddingVertical: 6,
  paddingHorizontal: 18,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 0,
},
closeButtonOvalText: {
  color: '#351560',
  fontWeight: 'bold',
  fontSize: 16,
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

// Add new styles at the end:
closeButtonAboveRow: {
  alignItems: 'center',
  marginTop: 10,
  marginBottom: 0,
},
closeButtonOvalSmall: {
  backgroundColor: '#fff',
  borderColor: '#351560',
  borderWidth: 2,
  borderRadius: 14,
  paddingVertical: 2,
  paddingHorizontal: 14,
  alignItems: 'center',
  justifyContent: 'center',
},
closeButtonOvalTextSmall: {
  color: '#351560',
  fontWeight: 'bold',
  fontSize: 13,
},
closeButtonAboveRowRightAligned: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginTop: 4,
  marginBottom: 0,
},
});

export default DiscoverScreen;
