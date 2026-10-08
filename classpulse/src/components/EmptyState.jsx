import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/tokens';

// ─────────────────────────────────────────
//  EmptyState — placeholder when a list is empty
//
//  Props:
//    icon     — emoji icon (default: '📭')
//    title    — main heading
//    message  — sub-text
//    action   — optional button or element below
// ─────────────────────────────────────────
export default function EmptyState({ icon = '📭', title = 'Nothing here', message, action }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={styles.action}>{action}</View>}
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
  iconBox: {
    width:           72,
    height:          72,
    borderRadius:    BorderRadius.xl,
    backgroundColor: Colors.bgSurface,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize:   FontSize.lg,
    fontWeight: '600',
    color:      Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign:  'center',
  },
  message: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: Spacing.lg,
  },
});
