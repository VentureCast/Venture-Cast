// components/ViewerPerShareGraph.tsx
//this appears only on the homepage (as of now)
import React from 'react';
import { View, Text,StyleSheet,} from 'react-native';

const ViewerPerShareGraph = ({ quarter, fiscalYear, valueOne, valueTwo, colorOne, colorTwo, margin}:any) => {

  return (
    <>
 
          <View style={styles.graphBox}>
            <View style={ {marginBottom: margin}}>
              <View style={styles.viewerGraph}>
                <View style={[styles.viewerDot, {backgroundColor: colorOne} ]}></View>
                {/* Need to change the color of the dot based on nuetral or change in value */}
                <Text style={styles.viewerValue}>{valueOne}</Text>
              </View>
              <View style={styles.viewerGraph}>
                <View style={[styles.viewerDot, {backgroundColor: colorTwo}]}></View>
                {/* Need to change the color of the dot based on nuetral or change in value */}
                <Text style={styles.viewerValue}>{valueTwo}</Text>
              </View>
            </View>
              <Text style={styles.viewerText}>{quarter}</Text>
              <Text style={styles.viewerText}>{fiscalYear}</Text>
          </View>
    </>
  );
};

// session 2:
//  then duplicate it for the next stock section

const styles = StyleSheet.create({
  graphBox: {
    marginVertical: 5,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  viewerGraph: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  viewerDot: {
    //backgroundColor: '#F75555', //semidown--'#FFB9B9',nuetral--'#C2B8CF', up --'#12D18E',
    width: 20, 
    height: 20,
    borderRadius: 20,
  },
  viewerValue: {
    fontFamily: 'urbanist',
    marginLeft: 5,
    fontSize: 12,
    color: '#212121',
  },
  viewerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewerText: {
    color:  '#616161',
    fontFamily: 'urbanist',
    fontWeight: '700',
    fontSize: 12,
  },
  // title
  sectionTitle: {
    alignContent: 'flex-start',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Urbanist-Regular',
    },
  marketStats: {
    margin: 20,
  },
});

export default ViewerPerShareGraph;
