import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { Colors, Spacing, FontSize } from '../../theme/tokens';
import AppHeader      from '../../components/AppHeader';
import Input          from '../../components/Input';
import Button         from '../../components/Button';
import SelectModal    from '../../components/SelectModal';
import DatePickerModal from '../../components/DatePickerModal';
import { studentsAPI } from '../../services/api';

const GRADE_OPTIONS = [
  '1st', '2nd', '3rd', '4th', '5th', '6th', 
  '7th', '8th', '9th', '10th', '11th', '12th'
];

const BLOOD_GROUP_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'
];

export default function AddStudentScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    grade: '',
    parent_name: '',
    parent_contact: '',
    monthly_fee: '',
    dob: '',
    blood_group: ''
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.grade.trim()) e.grade = 'Required';
    if (!form.parent_name.trim()) e.parent_name = 'Required';
    if (!form.parent_contact.trim() || form.parent_contact.length < 10) e.parent_contact = 'Valid 10-digit phone required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await studentsAPI.add({
        ...form,
        monthly_fee: form.monthly_fee ? parseFloat(form.monthly_fee) : 0
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        title="Add Student"
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input label="Student Name *" value={form.name} onChangeText={v => set('name', v)} error={errors.name} />
        
        <SelectModal 
          label="Grade / Standard *" 
          value={form.grade} 
          options={GRADE_OPTIONS} 
          onSelect={v => set('grade', v)} 
          error={errors.grade}
          placeholder="Select Grade (1st to 12th)"
        />
        
        <View style={styles.row}>
          <DatePickerModal 
            label="Date of Birth" 
            value={form.dob} 
            onChange={v => set('dob', v)} 
            maxDate="today"
            style={{flex: 1}} 
          />
          <SelectModal 
            label="Blood Group" 
            value={form.blood_group} 
            options={BLOOD_GROUP_OPTIONS} 
            onSelect={v => set('blood_group', v)} 
            placeholder="Select"
            style={{flex: 1}} 
          />
        </View>

        <Input label="Monthly Fee (₹)" value={form.monthly_fee} onChangeText={v => set('monthly_fee', v)} keyboardType="numeric" />

        <View style={styles.divider} />

        <Input label="Parent / Guardian Name *" value={form.parent_name} onChangeText={v => set('parent_name', v)} error={errors.parent_name} />
        <Input label="Parent Contact (Login ID) *" value={form.parent_contact} onChangeText={v => set('parent_contact', v)} keyboardType="phone-pad" maxLength={10} error={errors.parent_contact} />

        <Button title="Save Student" onPress={handleSave} loading={loading} style={styles.btn} size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  content: { paddingBottom: Spacing.xxl },
  cancelText: { color: Colors.textMuted, fontSize: FontSize.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },
  btn: { marginTop: Spacing.md }
});
