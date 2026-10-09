import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../theme/tokens';
import { today } from '../utils/formatters';

export default function DatePickerModal({ label, value, onChange, maxDate = null, placeholder = 'Select Date', error, style }) {
  const [visible, setVisible] = useState(false);

  const initialDate = value || today();
  const parts = initialDate.split('-');
  const [year, setYear]   = useState(parseInt(parts[0], 10) || new Date().getFullYear());
  const [month, setMonth] = useState(parseInt(parts[1], 10) || (new Date().getMonth() + 1));
  const [day, setDay]     = useState(parseInt(parts[2], 10) || new Date().getDate());

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const maxYear = maxDate ? currentYear : currentYear + 5;
  const minYear = currentYear - 80;
  const years = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  const months = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
  ];

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const isFuture = (y, m, d) => {
    if (!maxDate) return false;
    if (y > currentYear) return true;
    if (y === currentYear && m > currentMonth) return true;
    if (y === currentYear && m === currentMonth && d > currentDay) return true;
    return false;
  };

  const handleConfirm = () => {
    let validD = day;
    if (validD > daysInMonth) validD = daysInMonth;

    if (maxDate && isFuture(year, month, validD)) {
      const mStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
      const dStr = currentDay < 10 ? `0${currentDay}` : `${currentDay}`;
      onChange(`${currentYear}-${mStr}-${dStr}`);
    } else {
      const mStr = month < 10 ? `0${month}` : `${month}`;
      const dStr = validD < 10 ? `0${validD}` : `${validD}`;
      onChange(`${year}-${mStr}-${dStr}`);
    }
    setVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        activeOpacity={0.7}
        onPress={() => setVisible(true)}
      >
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || placeholder}
        </Text>
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <Text style={styles.title}>{label || 'Select Date'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              {/* Year */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Year</Text>
                <ScrollView style={styles.scrollCol} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {years.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.pickerItem, year === y && styles.pickerItemActive]}
                      onPress={() => setYear(y)}
                    >
                      <Text style={[styles.pickerItemText, year === y && styles.pickerItemTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Month</Text>
                <ScrollView style={styles.scrollCol} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {months.map(m => {
                    const disabled = maxDate && year === currentYear && m.value > currentMonth;
                    return (
                      <TouchableOpacity
                        key={m.value}
                        disabled={disabled}
                        style={[styles.pickerItem, month === m.value && styles.pickerItemActive, disabled && styles.disabledItem]}
                        onPress={() => setMonth(m.value)}
                      >
                        <Text style={[styles.pickerItemText, month === m.value && styles.pickerItemTextActive, disabled && styles.disabledText]}>{m.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Day */}
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Day</Text>
                <ScrollView style={styles.scrollCol} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {days.map(d => {
                    const disabled = maxDate && isFuture(year, month, d);
                    return (
                      <TouchableOpacity
                        key={d}
                        disabled={disabled}
                        style={[styles.pickerItem, day === d && styles.pickerItemActive, disabled && styles.disabledItem]}
                        onPress={() => setDay(d)}
                      >
                        <Text style={[styles.pickerItemText, day === d && styles.pickerItemTextActive, disabled && styles.disabledText]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Set Date ({year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day})</Text>
            </TouchableOpacity>
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
  calendarIcon: { fontSize: 14 },
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
    marginBottom: Spacing.md,
  },
  title: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: 'bold' },
  closeText: { color: Colors.textMuted, fontSize: FontSize.lg, fontWeight: 'bold' },
  pickerRow: { flexDirection: 'row', gap: Spacing.sm, height: 180, marginBottom: Spacing.md },
  column: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: 4 },
  columnTitle: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: 'bold', textAlign: 'center', marginVertical: 4 },
  scrollCol: { flex: 1 },
  pickerItem: { paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.sm },
  pickerItemActive: { backgroundColor: Colors.primary },
  pickerItemText: { color: Colors.textPrimary, fontSize: FontSize.sm },
  pickerItemTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  disabledItem: { opacity: 0.3 },
  disabledText: { color: Colors.textMuted },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: FontSize.md },
});
