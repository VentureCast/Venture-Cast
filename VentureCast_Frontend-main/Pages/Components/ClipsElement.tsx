// './Componets/ClipsElement'
import React from 'react';
import { View, Text, StyleSheet, Image, FlatList, } from 'react-native';
import { Button } from 'react-native-paper';

const clipsData =  [       
{ id: '1', image: require('../../Assets/Images/Clip1.png')}, 
{ id: '2', image: require('../../Assets/Images/Clip2.png')},
{ id: '3', image: require('../../Assets/Images/Clip3.png')}, 
{ id: '4', image: require('../../Assets/Images/Food-image-1.png')}, 
{ id: '5', image: require('../../Assets/Images/Food-image-2.png')}, 


]

const ClipsElement = ({ title, subTitle, icon, views }:any) => {
return (
    <>
        <View  style={styles.clipStockItem}>
            <View style={styles.stockNameLogo}> 
                <View style={styles.iconContainer}>
                    <Image source={icon} style={styles.icon} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.stockName}>{title}</Text>
                    <Text style={styles.stockTicker}>{subTitle}</Text>
                </View>
            </View>
            {/* need to make the right arrow buttons link somewhere*/}
            <View style={styles.buttonContainer}>
                <Text style={styles.viewCount}>{views} M</Text> 
                {/* need the views to round down views and then determin if it is nothing, k, M, or B */}
                <Image source={require('../../Assets/Icons/Arrow-right-2.png')} />
             </View>
        </View>
        <View style={styles.flatlistContainer}>
            <FlatList
            data={clipsData}
            renderItem={({ item }) => (
                <View style={styles.clipItem}>
                    <Image style={styles.clipImage} source = {item.image} />
                </View>
            )} // need to make the view number and icon layered on top of the "videos"
            // also need the images to be videos
            keyExtractor={item => item.id}
            horizontal={true} // Enable horizontal scrolling
            showsHorizontalScrollIndicator={true} // show the scroll indicator
            />
        </View>
    </>
 );
};

const styles = StyleSheet.create({
    flatlistContainer: {
        marginLeft: 10,
        marginRight: 20,
    },
    textContainer:{
        justifyContent: 'center',
    },
    viewCount: {
        fontFamily: 'Urbanist',
        fontSize: 14,
        fontWeight: '400',
        marginRight: 5,
    },
    stockNameLogo: {
        flexDirection: 'row',
    },
    iconContainer: {
        backgroundColor: '#EAE7EF',
        borderRadius: 100,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    icon: {
        width: 30,
        height: 30,
        padding: 10,
    },
    stockName: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Urbanist-Regular',
        marginBottom: 6,
    },
    stockTicker: {
        fontSize: 14,
        fontFamily: 'Urbanist',
        fontWeight: '500',
        color: '#black',
    },
    recentClips: {
        marginLeft: 20,
        marginBottom: 20,
        marginRight: 20,
    },
    clipStockItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 10,
    },

    clipItem: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginTop: 15,
    },
    clipImage: {
        width: 115,
        height:200,
        borderRadius: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 5,
    },
});

export default ClipsElement;
