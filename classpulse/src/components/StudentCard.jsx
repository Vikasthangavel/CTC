import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../theme/tokens';
import Badge from './Badge';
import { getInitials } from '../utils/formatters';

// ─────────────────────────────────────────
//  StudentCard — compact student list item
//
//  Props:
//    student   — student object { id, name, grade, parent_name, parent_contact, is_active }
//    onPress   — tap handler (navigate to detail)
//    onLongPress — long-press handler
//    rightAction — optional right-side element (button)
// ─────────────────────────────────────────
export default function StudentCard({ student, onPress, onLongPress, rightAction }) {
  const initials = getInitials(student.name);
  const isActive = student.is_active !== false && student.is_active !== 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.card}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          Grade {student.grade} · {student.parent_name}
        </Text>
        <Text style={styles.phone} numberOfLines={1}>{student.parent_contact}</Text>
      </View>

      {/* Right side */}
      <View style={styles.right}>
        {!isActive && <Badge label="Inactive" variant="muted" />}
        {rightAction}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bgCard,
    borderRadius:    BorderRadius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    BorderRadius.full,
    backgroundColor: `${Colors.primary}30`,
    borderWidth:     1,
    borderColor:     `${Colors.primary}50`,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     Spacing.md,
  },
  avatarText: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
    color:      Colors.primaryLight,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.semibold,
    color:      Colors.textPrimary,
    marginBottom: 2,
  },
  sub: {
    fontSize: FontSize.sm,
    color:    Colors.textSecondary,
    marginBottom: 2,
  },
  phone: {
    fontSize: FontSize.xs,
    color:    Colors.textMuted,
  },
  right: {
    alignItems:  'flex-end',
    marginLeft:  Spacing.sm,
  },
});
