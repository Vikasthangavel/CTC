import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/tokens';

// ─────────────────────────────────────────
//  Input — reusable text input with label and error
//
//  Props:
//    label        — field label
//    error        — error message string
//    style        — container style
//    inputStyle   — style for the input itself
//    ...rest      — all TextInput props (value, onChangeText, etc.)
// ─────────────────────────────────────────
export default function Input({ label, error, style, inputStyle, ...rest }) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={Colors.textMuted}
        selectionColor={Colors.primary}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize:    FontSize.sm,
    color:       Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight:  '500',
  },
  input: {
    backgroundColor: Colors.bgSurface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    fontSize:        FontSize.md,
    color:           Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    fontSize:   FontSize.xs,
    color:      Colors.danger,
    marginTop:  Spacing.xs,
  },
});
