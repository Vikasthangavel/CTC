import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import WelcomeScreen        from '../screens/auth/WelcomeScreen';
import LoginScreen          from '../screens/auth/LoginScreen';
import TuitionSignupScreen  from '../screens/auth/TuitionSignupScreen';

// Main Tab Navigators
import TuitionNavigator from './TuitionNavigator';
import ParentNavigator  from './ParentNavigator';

// Loading
import LoadingSpinner from '../components/LoadingSpinner';

const Stack = createNativeStackNavigator();

// ─────────────────────────────────────────
//  ClassPulse dark navigation theme
//  Applied to NavigationContainer so the background
//  matches the dark app theme on web + mobile.
// ─────────────────────────────────────────
const ClassPulseTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary:    '#6C5CE7',
    background: '#0F0E17',
    card:       '#1A1928',
    text:       '#FFFFFE',
    border:     '#2E2C4A',
  },
};

// ─────────────────────────────────────────
//  AppNavigator
//  Root navigator — decides which stack to show
//  based on auth state from AuthContext.
// ─────────────────────────────────────────
export default function AppNavigator() {
  const { isLoggedIn, isTuitionAdmin, isParent, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Starting ClassPulse..." />;
  }

  return (
    <NavigationContainer theme={ClassPulseTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {!isLoggedIn ? (
          // ── Auth Stack ──────────────────────────
          <>
            <Stack.Screen name="Welcome"       component={WelcomeScreen} />
            <Stack.Screen name="Login"         component={LoginScreen} />
            <Stack.Screen name="TuitionSignup" component={TuitionSignupScreen} />
          </>
        ) : isTuitionAdmin ? (
          // ── Tuition Admin App ───────────────────
          <Stack.Screen name="TuitionApp" component={TuitionNavigator} />
        ) : (
          // ── Parent App ──────────────────────────
          <Stack.Screen name="ParentApp" component={ParentNavigator} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
