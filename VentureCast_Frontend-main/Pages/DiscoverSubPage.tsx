import React from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, ImageBackground} from 'react-native';
import ClipsElement from './Components/ClipsElement';
import { useNavigation } from '@react-navigation/native';


const clipsData = 
  {description: 'High stakes and big wins', name: "Gambling", image: require('../Assets/Images/Gambling.png')}

const DiscoverSubPage = ({ navigation }: any) => {
  
  return (
  <>
   {/* balance and header also need to be imported data from user database  -- also need to add the search box and functionality*/}
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image style={styles.backArrow} source={require('../Assets/Icons/Arrow-Left.png')} />
      </TouchableOpacity>
      <View style={styles.clipTrendContainer}>
        <View style={styles.imageWrapper}>
          <ImageBackground source={clipsData.image} style={styles.image}>
            <View style={styles.textContainer}>
              <Text style={styles.categoryText}>{clipsData.name}</Text>
              <Text style={styles.categoryDescription}>{clipsData.description}</Text>
            </View>
          </ImageBackground>
        </View>
      </View>
      <View style={styles.bigTextBox}>
        <Text style={styles.bigTextBlock}>
        Popular gaming streamers have taken the internet by storm, attracting millions of viewers with 
        their unique personalities, skills, and interactive content. Streamers like Ninja, who rose to 
        fame playing Fortnite, and Pokimane, known for her variety of gaming and engaging chats, have 
        become household names in the gaming community. These creators often livestream their gameplay 
        on platforms like Twitch and YouTube, offering real-time entertainment and interaction with fans 
        through live chats. Many popular streamers are known for not only their gaming prowess but also 
        their humor, commentary, and ability to build strong fan communities. Their influence extends 
        beyond gaming, often branching into collaborations with brands, hosting live events, and creating diverse content.
        </Text>
        <Text style={styles.bigTextBlock}>
        Popular gaming streamers have revolutionized online entertainment, becoming key figures in the 
        gaming industry and beyond. Streamers like Ninja, who gained widespread fame through Fortnite, 
        and Pokimane, celebrated for her engaging personality and variety of games, have amassed millions 
        of followers on platforms like Twitch and YouTube. 
        </Text>
      </View>
      {/* Related Clips Section -- Needs to vary based on selected topic */}
      
      <View style = {styles.clipsSubTitle}>
        <Text style={styles.sectionTitle}>Related Clips</Text>
      </View>
      
      <View style={styles.sectionTitle}>
        <ClipsElement 
        title="#HighStakes" 
        subTitle="Trending Hashtag" 
        views={945.9}  
        icon = {require('../Assets/Icons/Play.png')}
        />
      {/* need this to be a button that opens up more clips */}
      </View>

    </ScrollView>
  </>
  );
};

const styles = StyleSheet.create({
// back arrow
backArrow: {
  margin: 20,  
  marginBottom: 10
},
container: {
  backgroundColor: '#FFFFFF',
  paddingBottom: 20,
},
sectionTitle: {
  alignContent: 'flex-start',
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
  fontFamily: 'Urbanist',
},
//text block
bigTextBox: {
  paddingHorizontal: 20,
},
bigTextBlock: {
  alignContent: 'flex-start',
  fontSize: 14,
  fontWeight: 100,
  marginVertical: 20,
  fontFamily: 'Urbanist',
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
  //Mini ClipTrend section

  textContainer: {
    flex: 1, 
    justifyContent: 'flex-end', // Align items at the bottom of the container
    padding: 10,
  },
  clipTrendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 10,
    height: 170,
    width: 380,   
  },
  categoryText: {
    fontSize: 20,
    marginHorizontal: 10,
    marginBottom: 10,
    color: 'white',
    fontFamily: 'Urbanist',
    fontWeight: 'bold',
  },
  categoryDescription: {
    fontSize: 14,
    marginHorizontal: 10,
    marginBottom: 10,
    color: 'white',
    fontFamily: 'Urbanist',
    fontWeight: "600",
  },
  image: {
    height: '100%',
    width: '100%', 
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 30, // Apply border radius here
    overflow: 'hidden', // Ensures the border radius is respected
  },
});

export default DiscoverSubPage;
