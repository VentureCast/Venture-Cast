// App.js
import * as React from 'react';
import { Image, Text, View , TouchableOpacity} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Or any icon library

//COLORS:
//Dark Purple: #351560
//Gray button fill: #EAE7EF
// positive green: #12D18E
// negative red: #F75555


//Sat task:
//finish trade page buttons
// settings, watchlist, and trans activity
// make sure all pages that need a header have it --> go back through sign in page
// create individiual stock page and stock page components



// Import your screens
import VentureCast from './Pages/VentureCast';
import CreateAccount from './Pages/CreateAccount';
import CreateAccountScreen from './Pages/CreateAccount2';
import SignInScreen from './Pages/SignInScreen';
// import HomeScreen from './Pages/HomeScreen'; // New Home Screen component
import WatchListScreen from './Pages/Watchlist'; // Example bottom tab screen
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

// header componets
import HeaderLeft from './Pages/Components/HeaderLeft';
import HeaderRight from './Pages/Components/HeaderRight';
import HeaderRightWatchlist from './Pages/Components/HeaderRightWatclist';


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
          fontSize: 22,
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
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Home" component={VentureCastHome} />
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
          component={ResetPassword2FA} // reset pass screen 1
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="FinalResetPassword"
          component={FinalResetPassword} // reset pass screen 1
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
          options={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#351560', // Background color of the header
            },
            headerTintColor: '#fff', // Color of back button and title text
            headerTitleStyle: {
              fontFamily: 'urbanist',
              fontSize: 22,
              fontWeight: 'bold', // Title text styling
            },//  Option B: Custom Headers
            headerLeft: () => (
              <HeaderLeft />
            ),
            headerRight: () => (
              <HeaderRightWatchlist />
            ),
          }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen} // Add the Notifs screen
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
            headerTitleStyle: {
              fontFamily: 'urbanist',
              fontSize: 22,
              fontWeight: 'bold', // Title text styling
            },//  Option B: Custom Headers
            headerLeft: () => (
              <HeaderLeft />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
           }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Activity"
          component={ActivityScreen} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Discover"
          component={DiscoverScreen} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="HomeScreen"
          component={VentureCastHome} // Add the Notifs screen
          options={{ headerShown: true }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Trade"
          component={TradeScreen} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="BuyStock"
          component={BuyStockScreen} // Add the buy stock screen
          options={{ headerShown: false }} // Hide header for bottom tabs
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
                fontSize: 22,
                fontWeight: 'bold',
                color: 'white' // this is for when the name is not the same as what we want to display
              }}>Discover</Text>
            ),
            headerLeft: () => (
              <HeaderLeft />
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
            headerShown: true,
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
              <HeaderLeft />
            ),
            headerRight: () => (
              <HeaderRight />
            ),
          }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Portfolio"
          component={PortfolioScreen} // Add the info from a discover item 
          options={{ headerShown: true }} // Hide header for bottom tabs
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
