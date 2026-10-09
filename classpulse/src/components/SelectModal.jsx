import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../theme/tokens';

export default function SelectModal({ label, value, options, onSelect, placeholder = 'Select option', error, style }) {
  const [visible, setVisible] = useState(false);

  const selectedItem = options.find(o => (typeof o === 'object' ? o.value === value : o === value));
  const displayText = selectedItem ? (typeof selectedItem === 'object' ? selectedItem.label : selectedItem) : null;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        activeOpacity={0.7}
        onPress={() => setVisible(true)}
      >
        <Text style={displayText ? styles.valueText : styles.placeholderText}>
          {displayText || placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <Text style={styles.title}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item, index) => (typeof item === 'object' ? String(item.value) : String(item))}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const itemVal = typeof item === 'object' ? item.value : item;
                const itemLbl = typeof item === 'object' ? item.label : item;
                const isSelected = String(itemVal) === String(value);
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(itemVal);
                      setVisible(false);
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {itemLbl}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputError: { borderColor: Colors.danger },
  valueText: { color: Colors.textPrimary, fontSize: FontSize.md },
  placeholderText: { color: Colors.textMuted, fontSize: FontSize.md },
  arrow: { color: Colors.textMuted, fontSize: 12 },
  errorText: { color: Colors.danger, fontSize: FontSize.xs, marginTop: 4 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  title: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: 'bold' },
  closeText: { color: Colors.textMuted, fontSize: FontSize.lg, fontWeight: 'bold' },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.border}50`,
  },
  optionSelected: { backgroundColor: `${Colors.primary}20` },
  optionText: { color: Colors.textPrimary, fontSize: FontSize.md },
  optionTextSelected: { color: Colors.primary, fontWeight: 'bold' },
  checkmark: { color: Colors.primary, fontWeight: 'bold' },
});
