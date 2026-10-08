import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../theme/tokens';

// ─────────────────────────────────────────
//  LoadingSpinner — centered spinner with optional message
//
//  Props:
//    message  — text below spinner (default: 'Loading...')
//    size     — 'small' | 'large'
//    style    — container style
// ─────────────────────────────────────────
export default function LoadingSpinner({ message = 'Loading...', size = 'large', style }) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         Spacing.xl,
  },
  text: {
    marginTop: Spacing.md,
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'center',
  },
});
