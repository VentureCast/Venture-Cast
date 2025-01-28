import React, {useState} from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity} from 'react-native';
import { transparent } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import Dropdown from './Components/Dropdown'; // does not do anything but is visible
// import LineGraph from './Components/LineGraph';
import StockItems from './Components/StockItems';
import formatCurrency from './Components/formatCurrency';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  StockPage: undefined; // Do this for all linked pages
  Portfolio: undefined;
  ClipsPage: undefined;
  short: undefined;
};

//Account details : cash, equity, daily change and such in a 2x2 grid 

const AccountDetail = ({ name, value, changePercent, image }: any) => {
  return (
      <View style={styles.accountDetail}>
        <Image source={image} style={styles.detailLogo} />
        <View style={styles.accountDetailContainer}>
          <Text style={styles.detailName}>{name}</Text>
          <Text style={styles.detailValue}>{formatCurrency(value)}</Text>
          <Text style={[styles.stockChange, changePercent >= 0 ? styles.positive : styles.negative]}>
            ({changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`})
          </Text>
        </View>
      </View>
  );
};

// Reusable component for Line Graph (Placeholder for now)
// made a separate component LineGraph

// Portfolio screen starts

const PortfolioScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  // Sample data for stock positions
  const stockData = [
    { id: '1', name: 'Dude Perfect', ticker: 'DUPT', price: 71.05, change: 2.94, logo: require('../Assets/Images/dude-perfect.png') },
    { id: '2', name: 'PewDiePie', ticker: 'PDP', price: 90.79, change: -2.16, logo: require('../Assets/Images/pewdiepie.png') },
    { id: '3', name: 'Jake Paul', ticker: 'JKPI', price: 207.47, change: 2.37, logo: require('../Assets/Images/jake-paul.png') },
    { id: '4', name: 'Jimmy BeastMode', ticker: 'MBT', price: 82.50, change: 2.94, logo: require('../Assets/Images/JimmyBeast.png') },
  ];

  const sampleData = [0, 1, 2, 3 ,5, ];

  const shortData = [
    { id: '1', name: 'Jimmy BeastMode', ticker: 'MBT', price: 82.50, change: 2.94, logo: require('../Assets/Images/JimmyBeast.png') },
    { id: '2', name: 'PewDiePie', ticker: 'PDP', price: 90.79, change: -2.16, logo: require('../Assets/Images/pewdiepie.png') },
    { id: '3', name: 'Jake Paul', ticker: 'JKPI', price: 207.47, change: 2.37, logo: require('../Assets/Images/jake-paul.png') },
    { id: '4', name: 'Dude Perfect', ticker: 'DUPT', price: 7.23, change: 5.89, logo: require('../Assets/Images/dude-perfect.png') },
  ];

  const acctData = [
    { id: '1', name: 'Cash', value: 23087.39, change: 0.00, image: require('../Assets/Images/cash.png') },
    { id: '2', name: 'Daily Change', value: 9739.36, change: 24.65, image: require('../Assets/Images/daily-change.png') },
    { id: '3', name: 'Equity', value: 186473.68, change: 55.54, image: require('../Assets/Images/equity.png') },
    { id: '4', name: 'Total Return', value: 66378.49, change: 24.65, image: require('../Assets/Images/total-return.png') }, //these images are not circles, or same dimensions: we need better ones
  ];

  const [showMore1, setShowMore1] = useState(false);
  const [displayedPositions1, setDisplayedPositions1] = useState(stockData.slice(0, 3));
  const [showMore2, setShowMore2] = useState(false);
  const [displayedPositions2, setDisplayedPositions2] = useState(shortData.slice(0, 3));

  const handleShowMore1 = () => {
    if (showMore1) {
      setDisplayedPositions1(stockData.slice(0, 3));
    } else {
      setDisplayedPositions1(stockData);
    }
    setShowMore1((prev) => !prev);
  };

  const handleShowMore2 = () => {
    if (showMore2) {
      setDisplayedPositions2(shortData.slice(0, 3));
    } else {
      setDisplayedPositions2(shortData);
    }
    setShowMore2((prev) => !prev);
  };


  const handleSort1 = (type: string) => {
    const sortedPositions = [...displayedPositions1];
    if (type === 'Price') {
      sortedPositions.sort((a, b) => a.price - b.price);
    } else if (type === 'Name') {
      sortedPositions.sort((a, b) => a.name.localeCompare(b.name));
    } else if (type === 'Percent') {
      sortedPositions.sort((a, b) => a.change - b.change);
    }
    setDisplayedPositions1(sortedPositions);
  };

  const handleSort2 = (type: string) => {
    const sortedPositions = [...displayedPositions2];
    if (type === 'Price') {
      sortedPositions.sort((a, b) => a.price - b.price);
    } else if (type === 'Name') {
      sortedPositions.sort((a, b) => a.name.localeCompare(b.name));
    } else if (type === 'Percent') {
      sortedPositions.sort((a, b) => a.change - b.change);
    }
    setDisplayedPositions2(sortedPositions);
  };

  return (
    <>
      <ScrollView style={styles.container}>

        {/* Line Graph */}
        {/* <LineGraph data={sampleData} background={require('../Assets/Images/portfolio-background.png')}/> */}
        <Image style={styles.backgroundImage} source={require('../Assets/Images/portfolio-background.png')} />

        {/* Account Summary Section */}
        <View style={styles.balanceBox}>
            <Text style={styles.balanceTitle}>{formatCurrency(229375.25)}</Text>
        </View>
          {/* my acct, new section 2x2 */}
        <View style={styles.accountSummary}>
          <Text style={styles.sectionTitle}>My Account</Text>
        </View>
        <View style={styles.accountGrid}>
          {acctData.map(acct => (
            <AccountDetail
              key={acct.id}
              image={acct.image}
              name={acct.name}
              value={acct.value}
              changePercent={acct.change}
            />
          ))}
        </View>

        {/* Stock Positions */}
        <View style={styles.stockList}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>My Stock Positions</Text>
            <Dropdown 
              dropOptions={['Price', 'Name', 'Percent']}
              filler='Sort By'
              onSelect={handleSort1}
            />
          </View>

          {displayedPositions1.map((stock) => (
            <StockItems
              key={stock.id}
              logo={stock.logo}
              name={stock.name}
              ticker={stock.ticker}
              price={stock.price}
              change={stock.change}
              changePercent={stock.change}
              onPress={() => navigation.navigate('StockPage')} // Pass the stock data to the details screen
            />
            ))
          } 
          
          {/* show more button that opens more items */}
          <TouchableOpacity style={styles.button} onPress={handleShowMore1}>
            <Text style={styles.buttonText}>{showMore1 ? 'Show Less' : 'Show More'}</Text>
          </TouchableOpacity>        
        </View>


        {/* short Positions */} 
        <View style={styles.stockList}>
          <View style={styles.stockTitleRow}>
            <Text style={styles.sectionTitle}>My Short Positions</Text>
            <Dropdown 
              dropOptions={['Price', 'Name', 'Percent']}
              filler='Sort By'
              onSelect={handleSort2}
            />
          </View>

            {displayedPositions2.map((short) => (
            <StockItems
              key={short.id}
              logo={short.logo}
              name={short.name}
              ticker={short.ticker}
              price={short.price}
              change={short.change}
              changePercent={short.change}
              onPress={() => navigation.navigate('short')} // Pass the stock data to the details screen, need to create a prop that actually does this
            />
            ))
          }

         {/* need this to be a button that opens up more short items */}
          <TouchableOpacity style={styles.button} onPress={handleShowMore2}>
            <Text style={styles.buttonText}>{showMore2 ? 'Show Less' : 'Show More'}</Text>
          </TouchableOpacity>       
        </View>
 
        {/* Recent Viral Clips Section */}
        <View style={styles.recentClips}>
          <TouchableOpacity onPress={() => navigation.navigate('ClipsPage')}>
            <View style = {styles.recentClipsTitle}>
              <Text style={styles.sectionTitle}>Recent Viral Clips</Text>
          {/* need this to be a button that opens up more clips */}
                <Image style={styles.rightArrow} source={require('../Assets/Icons/Arrow-right.png')} />
            </View>       
          </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    height: 350,
    marginBottom: 10,
  },
  accountSummary: {
    marginLeft: 20,
  },

  //showmore button
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  buttonText: {
    color: '#351560',
    fontSize: 16,
    fontWeight: 'semibold',
  },

  // the user balance

  balanceTitle: {
    fontFamily: 'Urbanist-Regular',
    fontSize: 40,
    fontWeight: 'bold',
  },
  balanceBox: {
    width: 382,
    height: 96,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
    borderColor: '#EEEEEE',
    borderWidth: 0.2,
  },
// user acct info section

  accountGrid: {
    flex: 1,
    flexDirection: 'row', // Arrange items in rows
    flexWrap: 'wrap', // Wrap to the next row if needed
    alignItems: 'center', // Center items vertically
    justifyContent: 'space-between',
    padding: 10,
  },
  accountText: {
    fontSize: 16,
    color: '#6c757d',    
    fontFamily: 'Urbanist-Regular',
  },
  accountTextChange: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'Urbanist-Regular',
  },
  accountDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 11,
    paddingLeft: 10,
    width: '50%',
  },
  detailLogo: {
    width: 60, 
    height: 60,
    marginRight: 8,
  },
  detailName: {
    color:'#757575',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Urbanist-Regular',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '500',
  },
  accountDetailContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start', 
  },

// stock/short list section

  stockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockList: {
    marginLeft: 20,
    marginBottom: 20,
    marginRight: 20,
    marginTop:20,   
  },
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
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Urbanist-Regular',
  },
  stockChange: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Urbanist-Regular',
    fontWeight: '600',
  },
  positive: {
    color: '#12D18E',
  },
  negative: {
    color: '#F75555',
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
    alignItems: 'center',
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
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  // show more button
  showMoreButton: {
    justifyContent: 'center',
  }
});

export default PortfolioScreen;
