import React, {useState, useEffect} from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import TrendBox from './Components/TrendBox';
import ClipsElement from './Components/ClipsElement';
import ClipTrend from './Components/ClipTrend';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../services/api';

type RootStackParamList = {
  StockPage: { streamer_id: string };
  Portfolio: undefined;
  ClipsPage: undefined;
};

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
      try {
        const data = await api.getCategories();
        setCategories(data.categories || []);
      } catch {
        setCategories([]);
      }
      setCategoriesLoading(false);
    };
    fetchCategories();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStreamerData, setFilteredStreamerData] = useState<any[]>([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchLoading(true);
      try {
        const data = await api.searchStreamers(query);
        setFilteredStreamerData(data.streamers || []);
      } catch {
        setFilteredStreamerData([]);
      }
      setSearchLoading(false);
    } else {
      setFilteredStreamerData([]);
    }
  };

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
  <>
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
            <View style={styles.closeButtonAboveRowRightAligned}>
              <TouchableOpacity
                style={styles.closeButtonOvalSmall}
                onPress={() => setSearchModalVisible(false)}
              >
                <Text style={styles.closeButtonOvalTextSmall}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingTop: 20, paddingBottom: 20 }}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search streamers..."
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
            {searchLoading ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>Searching...</Text>
            ) : (
              <FlatList
                data={filteredStreamerData}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchModalVisible(false);
                      navigation.navigate('StockPage', { streamer_id: item._id });
                    }}
                  >
                    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                      <Text style={{ color: '#888' }}>{item.ticker}</Text>
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
              icon={require('../Assets/Icons/check.png')}
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

const styles = StyleSheet.create({
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
  height: '88%',
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
container: {
  backgroundColor: '#FFFFFF',
  paddingBottom: 20,
},
categoriesContainer: {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
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
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: 20,
},
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
sectionWatchlist: {
  paddingHorizontal: 20,
  paddingVertical: 15,
  flexDirection: 'row',
},
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
