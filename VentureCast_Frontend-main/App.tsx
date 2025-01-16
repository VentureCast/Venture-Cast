// App.js
import * as React from 'react';
import { Image, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Or any icon library

//COLORS:
//Dark Purple: #351560
//Gray button fill: #EAE7EF
// positive green: #12D18E
// negative red: #F75555


//wednesday task:
//finish trade page buttons
//notifs settings, watchlist, and trans activity
//Want to give identifiers to all the pages and remove the default ones from the main tabs (probably an imbedded property)



// Import your screens
import VentureCast from './Pages/VentureCast';
import CreateAccount from './Pages/CreateAccount';
import CreateAccountScreen from './Pages/CreateAccount2';
import SignInScreen from './Pages/SignInScreen';
import EmailVerificationScreen from './Pages/EmailVerificationScreen';
import EnterEmailScreen from './Pages/EnterEmailScreen';
// import HomeScreen from './Pages/HomeScreen'; // New Home Screen component
import WatchListScreen from './Pages/Watchlist'; // Example bottom tab screen
import NotificationScreen from './Pages/Notifications';
import VentureCastHome from './Pages/Home';
import PortfolioScreen from './Pages/Portfolio';
import AccountScreen from './Pages/Account';
import ProfileScreen from './Pages/Account/Profile';
import ActivityScreen from './Pages/Activity';
import NotificationSettings from './Pages/NotificationSettings';
import DiscoverScreen from './Pages/DiscoverScreen';
import TradeScreen from './Pages/TradeScreen';
import BuyStockScreen from './Pages/BuyStock';
import DiscoverSubPage from './Pages/DiscoverSubPage';
import ClipsPage from './Pages/ClipsPage';

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
const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
      })}
      //need the Trade screen to go to the trade screen, not venture cast home (main home screen), we want the tabs to exist on all pages.
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
          options={{ title: 'VentureCast' }}
        />
        <Stack.Screen
          name="CreateAccount"
          component={CreateAccount}
          options={{ title: 'Create Account', gestureEnabled: false }} // Security: Disable gestures
        />
        <Stack.Screen
          name="CreateAccountStep2"
          component={CreateAccountScreen}
          options={{ title: 'Create Account Step 2', gestureEnabled: false }} // Security: Disable gestures
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ title: 'Sign In', gestureEnabled: false }} // Security: Disable gestures
        />
        <Stack.Screen
          name="SignInStep2"
          component={EnterEmailScreen}
          options={{ title: 'Sign In Step 2', gestureEnabled: false }} // Security: Disable gestures
        />
        <Stack.Screen
          name="SignInStep3"
          component={EmailVerificationScreen}
          options={{ title: 'Email Verification', gestureEnabled: false }} // Security: Disable gestures
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
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettings} // Add the Notifs screen
          options={{ headerShown: false }} // Hide header for bottom tabs
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
          options={{ headerShown: false }} // Hide header for bottom tabs
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
        options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
        name="ClipsPage"
        component={ClipsPage} // Add the info from a discover item 
        options={{ headerShown: false }} // Hide header for bottom tabs
        />
        <Stack.Screen
        name="Portfolio"
        component={PortfolioScreen} // Add the info from a discover item 
        options={{ headerShown: false }} // Hide header for bottom tabs
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
