import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../theme/tokens';

// ─────────────────────────────────────────
//  StatCard — shows a single metric (icon + label + value)
//
//  Props:
//    label     — metric name e.g. "Students"
//    value     — metric value e.g. "42"
//    icon      — emoji or icon element
//    color     — accent color for the icon background
//    style     — extra style
// ─────────────────────────────────────────
export default function StatCard({ label, value, icon, color = Colors.primary, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value ?? '—'}</Text>
      <Text style={styles.label}>{label}</Text>
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
    alignItems:      'center',
    flex:            1,
    ...Shadow.sm,
  },
  iconBox: {
    width:          48,
    height:         48,
    borderRadius:   BorderRadius.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  value: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    color:      Colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: FontSize.xs,
    color:    Colors.textMuted,
    textAlign:'center',
  },
});
