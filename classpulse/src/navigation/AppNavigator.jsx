import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/tokens';

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
//  ClassPulse navigation theme
// ─────────────────────────────────────────
const ClassPulseTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary:    Colors.primary,
    background: Colors.bg,
    card:       Colors.bgCard,
    text:       Colors.textPrimary,
    border:     Colors.border,
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
