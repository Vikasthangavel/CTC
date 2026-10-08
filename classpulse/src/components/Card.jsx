import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../theme/tokens';

// ─────────────────────────────────────────
//  Card — reusable container with glass-dark styling
//
//  Props:
//    style       — additional style overrides
//    onPress     — make card tappable
//    children    — any content
// ─────────────────────────────────────────
export default function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} style={[styles.card, style]} onPress={onPress}>
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius:    BorderRadius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    ...Shadow.sm,
  },
});
