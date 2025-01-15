import React from 'react';
import { View, ScrollView, StyleSheet, Image, Text} from 'react-native';
import Header from './Components/Header';
import TrendBox from './Components/TrendBox';
import MiniWatchlist from './Components/MiniWatchlist';
import StockDetailsScreen from './StockDetails';
import ClipsElement from './Components/ClipsElement';
import MiniStockScroll from './Components/MiniStockScroll';
import ActionButtonDark from './Components/ActionButtonDark';
import StaticHeader from './Components/StaticHeader';



const userData = [
  {id: '1', balance: '229,375.25', moneyChange:'66,378.49', percentChange: '24.65' }
]

//category data, should be imported from database
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

const DiscoverScreen = () => {
  return (
  <>
    <StaticHeader 

    />
   {/* balance and header also need to be imported data from user database*/}
    <ScrollView contentContainerStyle={styles.container}>
      {/* Trending Section */}
      <View style={styles.categoriesContainer}>
      {trendData.map(trend => (
            <TrendBox
              key={trend.id}
              name={trend.name}
              icon={trend.icon}
            />
          ))}
      </View>
      
      {/* Clips & News Section -- change the clipitem componet tot he one from portfolio screen, then update portfolio with component */}
      
      <View style = {styles.clipsSubTitle}>
            <Text style={styles.sectionTitle}>Clips & News</Text>
         {/* need this to be a button that opens up more clips */}
            <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
      </View>
      
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
