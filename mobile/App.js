import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
} from '@expo-google-fonts/outfit';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MoodProvider } from './src/context/MoodContext';
import { theme } from './src/styles/theme';
import ErrorBoundary from './src/components/ErrorBoundary';

import SplashScreen from './src/pages/Splash';
import LoginScreen from './src/pages/Login';
import HomeScreen from './src/pages/Home';
import MoodCheckScreen from './src/pages/MoodCheck';
import MoodInsightsScreen from './src/pages/MoodInsights';
import JournalScreen from './src/pages/Journal';
import JournalEntryScreen from './src/pages/JournalEntry';
import BreathingScreen from './src/pages/Breathing';
import EmotionRoomsScreen from './src/pages/EmotionRooms';
import ChatRoomScreen from './src/pages/ChatRoom';
import MotivationScreen from './src/pages/Motivation';
import ProfileScreen from './src/pages/Profile';
import AdminDashboardScreen from './src/pages/AdminDashboard';
import AdminChatReportsScreen from './src/pages/AdminChatReports';
import MyChatReportsScreen from './src/pages/MyChatReports';

const Stack = createNativeStackNavigator();

// Notification handler intentionally disabled in this build.
// If reminders are needed, rebuild native app with expo-notifications support.

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.dark.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <MoodProvider>
      <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MoodCheck" component={MoodCheckScreen} />
          <Stack.Screen name="MoodInsights" component={MoodInsightsScreen} />
          <Stack.Screen name="Journal" component={JournalScreen} />
          <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
          <Stack.Screen name="Breathing" component={BreathingScreen} />
          <Stack.Screen name="EmotionRooms" component={EmotionRoomsScreen} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
          <Stack.Screen name="Motivation" component={MotivationScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{
              gestureEnabled: false,
              animation: 'fade_from_bottom',
            }}
          />
          <Stack.Screen name="AdminChatReports" component={AdminChatReportsScreen} />
          <Stack.Screen name="MyChatReports" component={MyChatReportsScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
      </ErrorBoundary>
    </MoodProvider>
    </SafeAreaProvider>
  );
}
