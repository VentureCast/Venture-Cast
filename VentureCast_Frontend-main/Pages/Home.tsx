import React from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity} from 'react-native';
import Header from './Components/Header';
import CategoryBox from './Components/CategoryBox';
import MiniWatchlist from './Components/MiniWatchlist';
import StockDetailsScreen from './StockDetails';
import ClipsElement from './Components/ClipsElement';
import MiniStockScroll from './Components/MiniStockScroll';
import ActionButtonDark from './Components/ActionButtonDark';
import StaticHeader from './Components/StaticHeader';
import { useNavigation } from '@react-navigation/native';



const userData = [
  {id: '1', balance: '229,375.25', moneyChange:'66,378.49', percentChange: '24.65' }
]

//category data, should be imported from database
const categoryData = [
{id: '1', name: "Gaming", percentage: '3.57', graph: require('../Assets/Graphs/Positive-Graph-1.png') },
{id: '2', name: "Gambling", percentage:'-1.96', graph: require('../Assets/Graphs/Negative-Graph-1.png')},
{id: '3', name: "Chatting", percentage: '2.85', graph: require('../Assets/Graphs/Positive-Graph-2.png')},
];

const VentureCastHome = () => {
  const navigation = useNavigation();
  return (
  <>
   {/* balance and header also need to be imported data from user database*/}
    <ScrollView contentContainerStyle={styles.container}>
    {userData.map(user => (
            <Header
              key={user.id}
              moneyChange={user.moneyChange}
              balance={user.balance}
              percentChange={user.percentChange}
            />
          ))}
      
      {/* Categories Section  graphs need to become functions of change of price(fund) over time*/}
      <View style={styles.categoriesContainer}>
      {categoryData.map(category => (
            <CategoryBox
              key={category.id}
              graph={category.graph}
              name={category.name}
              percentage={category.percentage}
            />
          ))}
      </View>

      {/* Watch List Section */}
      
        <View style = {styles.subTitle}>
            <Text style={styles.sectionTitle}>Watchlist</Text>
         {/* need this to be a button that opens up more clips */}
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
        </View>

      <View>
        <View style={styles.sectionWatchlist}>
            <MiniWatchlist />
        </View>
      </View>

      {/* My Stocks Section */}

      <View style = {styles.subTitle}>
            <Text style={styles.sectionTitle}>My Stocks</Text>
         {/* need this to be a button that opens up more clips */}
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
      </View>
      <View style={styles.sectionWatchlist}>     
      <MiniStockScroll />
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

      {/* Deposit to Venture Cast Button: would like this to appear when 
      the "top-locked" one dissapears adn then stick to the nav tab*/}
      <ActionButtonDark label="Deposit to VentureCast" onPress={() => {}} large={true} />
        
    </ScrollView>
  </>
  );
};


// notes for second session:
// the deposit funds button to the header component
//

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',
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
  // idek what is going on, jk i do
  temp: {
    height: 50,
  } 
});

export default VentureCastHome;
