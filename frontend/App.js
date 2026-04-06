import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import DecisionScreen from './src/screens/DecisionScreen';
import GuidedPathScreen from './src/screens/GuidedPathScreen';
import ResultScreen from './src/screens/ResultScreen';

import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import RequestDetailScreen from './src/screens/RequestDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* Auth */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

        {/* Resident */}
        <Stack.Screen name="Decision" component={DecisionScreen} />
        <Stack.Screen name="GuidedPath" component={GuidedPathScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />

        {/* Admin */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}