import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/tokens';

// ─────────────────────────────────────────
//  Badge — colored status tag
//
//  Props:
//    label    — text inside badge
//    variant  — 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'muted'
//    style    — extra style
// ─────────────────────────────────────────
export default function Badge({ label, variant = 'primary', style }) {
  const variantStyle = styles[variant] || styles.primary;
  const textStyle    = textStyles[variant] || textStyles.primary;

  return (
    <View style={[styles.badge, variantStyle, style]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   3,
    borderRadius:      BorderRadius.full,
    alignSelf:         'flex-start',
  },
  text: {
    fontSize:   FontSize.xs,
    fontWeight: '600',
  },
  // Variants
  primary:  { backgroundColor: `${Colors.primary}25` },
  success:  { backgroundColor: `${Colors.success}25` },
  warning:  { backgroundColor: `${Colors.warning}25` },
  danger:   { backgroundColor: `${Colors.danger}25` },
  info:     { backgroundColor: `${Colors.info}25`    },
  muted:    { backgroundColor: Colors.bgSurface       },
});

const textStyles = StyleSheet.create({
  primary:  { color: Colors.primaryLight },
  success:  { color: Colors.success      },
  warning:  { color: Colors.warning      },
  danger:   { color: Colors.danger       },
  info:     { color: Colors.info         },
  muted:    { color: Colors.textMuted    },
});
