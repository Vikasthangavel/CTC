import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../theme/tokens';

// ─────────────────────────────────────────
//  AppHeader — screen title + optional subtitle + right element
//
//  Props:
//    title      — main screen title
//    subtitle   — optional small text below title
//    right      — optional right-side element (button, icon)
//    style      — extra style
// ─────────────────────────────────────────
export default function AppHeader({ title, subtitle, right, style }) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingBottom:  Spacing.md,
    marginBottom:   Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    color:      Colors.textPrimary,
  },
  subtitle: {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    marginTop:  2,
  },
  right: {
    marginLeft: Spacing.md,
  },
});
