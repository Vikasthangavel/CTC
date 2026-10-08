import 'react-native-gesture-handler';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// ─────────────────────────────────────────
//  ClassPulse — Root App Component
//  Works on Android, iOS and Web (Expo).
// ─────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // On web, cap the width to a phone-like frame for better preview
    ...(Platform.OS === 'web' && {
      maxWidth:  430,
      marginHorizontal: 'auto',
      minHeight: '100vh',
    }),
  },
});
