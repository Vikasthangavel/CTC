import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../theme/tokens';

// ─────────────────────────────────────────
//  Button — primary, secondary, outline, danger variants
//
//  Props:
//    title     — button label
//    onPress   — press handler
//    variant   — 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
//    size      — 'sm' | 'md' | 'lg'
//    loading   — show spinner instead of label
//    disabled  — disables interaction
//    style     — extra style
//    icon      — optional left icon element
// ─────────────────────────────────────────
export default function Button({
  title,
  onPress,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  style,
  icon,
}) {
  const variantStyle = styles[variant] || styles.primary;
  const sizeStyle    = styles[`size_${size}`] || styles.size_md;
  const textStyle    = textStyles[variant] || textStyles.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, variantStyle, sizeStyle, disabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textPrimary} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, textStyle, styles[`textSize_${size}`]]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius:    BorderRadius.md,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
    ...Shadow.sm,
  },
  content: {
    flexDirection:  'row',
    alignItems:     'center',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth:     1.5,
    borderColor:     Colors.primary,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  ghost: {
    backgroundColor: Colors.bgSurface,
  },
  disabled: {
    opacity: 0.45,
  },

  // Sizes
  size_sm: { paddingHorizontal: Spacing.md,  paddingVertical: Spacing.xs },
  size_md: { paddingHorizontal: Spacing.lg,  paddingVertical: Spacing.sm + 4 },
  size_lg: { paddingHorizontal: Spacing.xl,  paddingVertical: Spacing.md },
  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.md },
  textSize_lg: { fontSize: FontSize.lg },
});

const textStyles = StyleSheet.create({
  primary:   { color: Colors.textPrimary },
  secondary: { color: Colors.textInverse },
  outline:   { color: Colors.primary },
  danger:    { color: Colors.textPrimary },
  ghost:     { color: Colors.textSecondary },
});
