// App.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Or any icon library

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
import { Text, View } from 'react-native';
import VentureCastHome from './Pages/Home';
import PortfolioScreen from './Pages/Portfolio';
import AccountScreen from './Pages/Account';
import ProfileScreen from './Pages/Account/Profile';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Home Tabs (Bottom Tab Navigator)
const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'WatchList') {
            iconName = 'list';
          } else if (route.name === 'Portfolio') {
            iconName = 'wallet';
          }

          // Return the corresponding icon for each tab
          return  <Text>Icon</Text>
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={VentureCastHome} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen name="WatchList" component={WatchListScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
