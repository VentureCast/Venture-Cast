// App.js
import * as React from 'react';
import { Image, Text, View , TouchableOpacity} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

//COLORS:
//Dark Purple: #351560
//Gray button fill: #EAE7EF
// positive green: #12D18E
// negative red: #F75555

// Next tasks:
// create remaining pages: do we need deposit/withdraw preview?
    // look into importing stocks from a dummy database for smoother integration
    // link items so that pages open corresponding 

// Graph page from graph click


// Need help: 
// making the graphs and the video scroll section

// go in anywhere i(matt) typed out the format currency function and replace it with the formatCurrency component (adds $ + , and makes 2 decimals )

// Import your screens
import VentureCast from './Pages/VentureCast';
import CreateAccount from './Pages/CreateAccount';
import CreateAccountScreen from './Pages/CreateAccount2';
import SignInScreen from './Pages/SignInScreen';
// header components
import HeaderLeft from './Pages/Components/HeaderLeft';
import HeaderRight from './Pages/Components/HeaderRight';
import StockPage from './Pages/StockPage';
import HeaderLeftStock from './Pages/Components/HeaderLeftStock';
import HeaderRightStock from './Pages/Components/HeaderRightStock';
import HeaderLeftNotTabs from './Pages/Components/HeaderLeftNotTabs';
// import HomeScreen from './Pages/HomeScreen'; // New Home Screen component
import WatchListScreen from './Pages/Watchlist';
import NotificationScreen from './Pages/Notifications';
import VentureCastHome from './Pages/Home';
import PortfolioScreen from './Pages/Portfolio';
import AccountScreen from './Pages/Account';
import ProfileScreen from './Pages/Account/Profile';
import ActivityScreen from './Pages/Activity';
import SettingsScreen from './Pages/SettingsScreen';
import DiscoverScreen from './Pages/DiscoverScreen';
import TradeScreen from './Pages/TradeScreen';
import BuyStockScreen from './Pages/BuyStock';
import DiscoverSubPage from './Pages/DiscoverSubPage';
import ClipsPage from './Pages/ClipsPage';
import ResetPassword from './Pages/ResetPassword';
import ResetPassword2FA from './Pages/ResetPassword2FA';
import FinalResetPassword from './Pages/FinalResetPassword';
import TwoFA from './Pages/2FA';
import AboutVentureCastScreen from './Pages/About';
import ChangePassword from './Pages/ChangePassword';
import HelpCenter from './Pages/Account/HelpCenter';
import PaymentMethods from './Pages/PaymentMethods';
import AddPayment from './Pages/AddPayment';
import Withdraw from './Pages/Withdraw';
import Deposit from './Pages/Deposit';
import WithdrawOption from './Pages/WithdrawOption';
import DepositOption from './Pages/DepositOption';
import WithdrawCongrats from './Pages/WithdrawCongrats';
import DepositCongrats from './Pages/DepositCongrats';
import BuyInter from './Pages/BuyInter';
import SellInter from './Pages/SellInter';
import ShortInter from './Pages/ShortInter';
import ShortStockScreen from './Pages/ShortStock';
import FundingActivity from './Pages/FundingActivity';
import BuyCongrats from './Pages/BuyCongrats';
import BuyPreview from './Pages/BuyPreview';
import SellCongrats from './Pages/SellCongrats';
import SellPreview from './Pages/SellPreview';
import SellStock from './Pages/SellStock';
import NotificationSettings from './Pages/NotificationSettings';
import EditPaymentMethod from './Pages/EditPaymentMethod';
import GraphPage from './Pages/GraphPage';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const portfolio = require('./Assets/Icons/Activity.png');
const portfolioFocused = require('./Assets/Icons/Activity-focused.png');
const discover = require('./Assets/Icons/Discovery.png');
const discoverFocused = require('./Assets/Icons/Discovery-focused.png');
const trade = require('./Assets/Icons/Trade.png');
const tradeFocused = require('./Assets/Icons/Trade-focused.png');
const account = require('./Assets/Icons/Profile.png');
const accountFocused = require('./Assets/Icons/Profile-focused.png');
const home = require('./Assets/Icons/Home.png');
const homeFocused = require('./Assets/Icons/HomePurple.png');

// Home Tabs (Bottom Tab Navigator)
const HomeTabs = ({navigation}:any) => {
  return (
    <Tab.Navigator
      screenOptions={({ route  }) => ({
        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (route.name === 'Portfolio') {
            iconSource = focused 
            ? portfolioFocused // Path to active home icon
            : portfolio; // Path to inactive home icon
          } else if (route.name === 'Discover') {
            iconSource = focused
            ? discoverFocused // Path to active home icon
            : discover; // Path to inactive home icon
          } else if (route.name === 'Trade') {
            iconSource = focused
            ? tradeFocused // Path to active home icon
            : trade; // Path to inactive home icon
          } else if (route.name === 'Account') {
            iconSource = focused
            ? accountFocused // Path to active home icon
            : account; // Path to inactive home icon
          } else if (route.name === 'Home') {
            iconSource = focused
            ? homeFocused // Path to active home icon
            : home; // Path to inactive home icon
          }
          // Return the corresponding icon for each tab
          return (
            <Image
              source={iconSource}
              style={{
                width: 24,
                height: 24,
              }}
            />
          );
        },
        tabBarActiveTintColor: '#351560',
        tabBarInactiveTintColor: 'gray',
        headerShown: true, //  Option A: Remove the header
        headerStyle: {
          backgroundColor: '#351560', // Background color of the header
        },
        headerTintColor: '#fff', // Color of back button and title text
        headerTitleStyle: {
          fontFamily: 'urbanist',
          fontSize: 26,
          fontWeight: 'bold', // Title text styling
        },//  Option B: Custom Headers
        headerLeft: () => (
          <HeaderLeft />
        ),
        headerRight: () => (
          <HeaderRight />
        ),
      })}
    >
      <Tab.Screen name="Home" component={VentureCastHome} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Trade" component={TradeScreen} /> 
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

// Main App Navigation
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="VentureCast">
        <Stack.Screen
          name="VentureCast"
          component={VentureCast}
          options={{ title: 'VentureCast', headerShown: false}}
        />
        <Stack.Screen
          name="CreateAccount"
          component={CreateAccount}
          options={{ gestureEnabled: false, headerShown: false }} // Security: Disable gestures
        />
        <Stack.Screen
          name="CreateAccountStep2"
          component={CreateAccountScreen}
          options={{ gestureEnabled: false, headerShown: false}} // Security: Disable gestures
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ gestureEnabled: false , headerShown: false}} // Security: Disable gestures
        />
        <Stack.Screen
          name="2FA"
          component={TwoFA}
          options={{ gestureEnabled: false, headerShown: false }} // Security: Disable gestures
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword} // change pass screen 1
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPassword} // reset pass screen 1
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="ResetPassword2FA"
          component={ResetPassword2FA} // reset pass screen 2
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="FinalResetPassword"
          component={FinalResetPassword} // reset pass screen 3
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Home"
          component={HomeTabs} // Add the Bottom Tab Navigator as the Home screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen} // Add the Bottom Tab Navigator as the Home screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Watchlist"
          component={WatchListScreen} // Add the Watchlist screen
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="PaymentMethods"
          component={PaymentMethods} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="AddPayment"
          component={AddPayment} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="EditPaymentMethod"
          component={EditPaymentMethod} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="SettingsScreen"
          component={SettingsScreen} // Add the Notifs screen
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTintColor: '#fff', // Color of back button and title text
            headerTitle: () => (
              <Text style={ {
                fontFamily: 'urbanist',
                fontSize: 26,
                fontWeight: 'bold',
                color: 'white' // this is for when the name is not the same as what we want to display
              }}>Settings</Text>
            ),
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
           }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettings} // Add the Notifs screen
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTintColor: '#fff', // Color of back button and title text
            headerTitle: () => (
              <Text style={ {
                fontFamily: 'Urbanist-Regular',
                fontSize: 26,
                fontWeight: 'bold',
                color: 'white' // this is for when the name is not the same as what we want to display
              }}>Settings</Text>
            ),
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
           }}
        />
        <Stack.Screen
          name="Activity"
          component={ActivityScreen} // Add the Trade Activity screen
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="FundingActivity"
          component={FundingActivity} // Add the Transaction Activity screen
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="GraphPage"
          component={GraphPage} // Add the Transaction Activity screen
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="Discover"
          component={DiscoverScreen} // Add the Notifs screen
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTintColor: '#fff', // Color of back button and title text
            headerTitleStyle: {
              fontFamily: 'urbanist',
              fontSize: 26,
              fontWeight: 'bold', // Title text styling
            },//  Option B: Custom Headers
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
          }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="HomeScreen"
          component={VentureCastHome} // Add the home screen
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTintColor: '#fff', // Color of back button and title text
            headerTitleStyle: {
              fontFamily: 'urbanist',
              fontSize: 26,
              fontWeight: 'bold', // Title text styling
            },//  Option B: Custom Headers
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
          }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Trade"
          component={TradeScreen} // Add the trade screen
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTintColor: '#fff', // Color of back button and title text
            headerTitleStyle: {
              fontFamily: 'urbanist',
              fontSize: 26,
              fontWeight: 'bold', // Title text styling
            },//  Option B: Custom Headers
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
          }} // Hide header for bottom tabs        
        />
        <Stack.Screen
          name="BuyStock"
          component={BuyStockScreen} // Add the buy stock screen
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="BuyCongrats"
          component={BuyCongrats} // Add the buy stock screen final
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="BuyPreview"
          component={BuyPreview} // Add the preview to the buy stock screen
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="SellCongrats"
          component={SellCongrats} // Add the sell stock final screen
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="SellStock"
          component={SellStock} // Add the sell stock screen
          options={{ headerShown: false }}
        /> 
        <Stack.Screen
          name="SellPreview"
          component={SellPreview} // Add the preview to sell stock screen
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ShortStock"
          component={ShortStockScreen} // Add the short stock screen
          options={{ headerShown: false }}
        /> 
        <Stack.Screen
          name="BuyInter"
          component={BuyInter} // Add the buy intermediate screen
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="ShortInter"
          component={ShortInter} // Add the short intermediate  screen
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="SellInter"
          component={SellInter} // Add the sell intermediate stock screen
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="Withdraw"
          component={Withdraw} // Add the withdraw screen
          options={{ headerShown: false }} 
        />      
        <Stack.Screen
          name="Deposit"
          component={Deposit} // Add the deposit screen
          options={{ headerShown: false }} 
        /> 
        <Stack.Screen
          name="WithdrawCongrats"
          component={WithdrawCongrats} // Add the withdraw final screen
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="DepositCongrats"
          component={DepositCongrats} // Add the deposit final screen
          options={{ headerShown: false }} 
        />         
        <Stack.Screen
          name="WithdrawOption"
          component={WithdrawOption} // Add the withdraw options screen
          options={{ headerShown: false }} 
        />   
        <Stack.Screen
          name="DepositOption"
          component={DepositOption} // Add the deposit options screen
          options={{ headerShown: false }} 
        />  
        <Stack.Screen
          name="DiscoverSubPage"
          component={DiscoverSubPage} // Add the info from a discover item 
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTitle: () => (
              <Text style={ {
                fontFamily: 'urbanist',
                fontSize: 26,
                fontWeight: 'bold',
                color: 'white' // this is for when the name is not the same as what we want to display
              }}>Discover</Text>
            ),
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
           }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="ClipsPage"
          component={ClipsPage} // Add the info from a discover item 
          options={{ 
            headerShown: false, // temporarily false because header feels clustered, i could just remove back arrow bc logo takes u home
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTitle: () => (
              <Text style={ {
                fontFamily: 'urbanist',
                fontSize: 22,
                fontWeight: 'bold',
                color: 'white' // this is for when the name is not the same as what we want to display
              }}>Clips</Text>
            ),
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
          }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Portfolio"
          component={PortfolioScreen} // Add the info from a discover item 
          options={{     
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTintColor: '#fff', // Color of back button and title text
            headerTitleStyle: {
              fontFamily: 'urbanist',
              fontSize: 26,
              fontWeight: 'bold', // Title text styling
            },//  Option B: Custom Headers
            headerLeft: () => (
              <HeaderLeftNotTabs />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
          }} 
        />
        <Stack.Screen
          name="About"
          component={AboutVentureCastScreen} // Add the info from a discover item 
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="HelpCenter"
          component={HelpCenter} // Add the info from a discover item 
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="StockPage"
          component={StockPage} // Add the info from a discover item 
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTitle: () => (
              <Text></Text>
            ),
            headerLeft: () => (
              <HeaderLeftStock />
            ),
            headerRight: () => (
              <HeaderRightStock />
            ),
          }} // Hide header for bottom tabs
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

// import 'react-native-url-polyfill/auto';
// import React, { useEffect, useState } from 'react';
// import { supabase } from './supabaseClient'; // Ensure this is correct
// import { Text, View, StyleSheet, ScrollView } from 'react-native'; // Import relevant components from React Native

// interface Portfolio {
//   portfolio_id: string; // UUID
//   Streamer_id: string;  // UUID
//   created_at: string;   // Timestamptz (ISO 8601 format)
//   shares_owned: number; // int4
//   average_cost: number; // float4
// }

// function PortfolioData() {
//   const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchPortfolio = async () => {
//       setLoading(true);

//       try {
//         // Fetch data from Supabase table
//         const { data, error } = await supabase
//           .from('Portfolio') // Table name
//           .select('*'); // Select all columns

//         if (error) {
//           console.error('Error fetching portfolio data:', error);
//           setError(error.message);
//         } else {
//           console.log(data); // Log the fetched data
//           setPortfolio(data as Portfolio[]); // Type the data as Portfolio[]
//         }
//       } catch (err) {
//         console.error('Unexpected error occurred:', err);
//         setError('An unexpected error occurred');
//       }

//       setLoading(false);
//     };

//     fetchPortfolio();
//   }, []);

//   if (loading) return <Text>Loading...</Text>;
//   if (error) return <Text>Error: {error}</Text>;

//   return (
//     <ScrollView contentContainerStyle={styles.tableContainer}>
//       {portfolio.map((item) => (
//         <View key={item.portfolio_id} style={styles.dataContainer}>
//           <Text>Portfolio ID: {item.portfolio_id}</Text>
//           <Text>Streamer ID: {item.Streamer_id}</Text>
//           <Text>Created At: {item.created_at}</Text>
//           <Text>Shares Owned: {item.shares_owned}</Text>
//           <Text>Average Cost: {item.average_cost}</Text>
//         </View>
//       ))}
//     </ScrollView>
//   );
// }

// export default function App() {
//   return (
//     <View style={styles.appContainer}>
//       <PortfolioData />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   appContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#f0f0f0',
//   },
//   tableContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   dataContainer: {
//     marginBottom: 20,
//   },
// });
