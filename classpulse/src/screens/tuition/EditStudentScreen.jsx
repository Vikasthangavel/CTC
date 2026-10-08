import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/tokens';
import AppHeader from '../../components/AppHeader';
import Input     from '../../components/Input';
import Button    from '../../components/Button';
import { studentsAPI } from '../../services/api';

export default function EditStudentScreen({ route, navigation }) {
  const student = route.params?.student;

  const [form, setForm] = useState({
    name:           student?.name || '',
    grade:          student?.grade?.toString() || '',
    parent_name:    student?.parent_name || '',
    parent_contact: student?.parent_contact || '',
    monthly_fee:    student?.monthly_fee?.toString() || '0',
    dob:            student?.dob || '',
    blood_group:    student?.blood_group || '',
    is_active:      student?.is_active === 1
  });
  
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const set = (f, v) => {
    setForm(p => ({ ...p, [f]: v }));
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await studentsAPI.update(student.id, {
        ...form,
        monthly_fee: parseFloat(form.monthly_fee) || 0
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (form.is_active) {
      Alert.alert('Cannot Delete', 'Please deactivate the student first before deleting.');
      return;
    }
    Alert.alert('Delete Student', `Are you sure you want to permanently delete ${student.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await studentsAPI.delete(student.id);
          navigation.goBack();
        } catch(e) {
          Alert.alert('Error', e?.response?.data?.message || 'Failed to delete');
        }
      }}
    ]);
  };

  const toggleActive = async () => {
    try {
      await studentsAPI.toggleActive(student.id);
      setForm(p => ({ ...p, is_active: !p.is_active }));
    } catch(e) {
      Alert.alert('Error', 'Could not toggle status');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        title="Edit Student"
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Status Toggle */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Status: <Text style={{color: form.is_active ? Colors.success : Colors.danger}}>{form.is_active ? 'Active' : 'Inactive'}</Text></Text>
          <Button 
            title={form.is_active ? 'Deactivate' : 'Activate'} 
            variant="outline" 
            size="sm"
            onPress={toggleActive} 
          />
        </View>

        <Input label="Student Name" value={form.name} onChangeText={v => set('name', v)} />
        <Input label="Grade / Standard" value={form.grade} onChangeText={v => set('grade', v)} keyboardType="numeric" />
        
        <View style={styles.row}>
          <Input label="Date of Birth" value={form.dob} onChangeText={v => set('dob', v)} style={{flex:1}} />
          <Input label="Blood Group" value={form.blood_group} onChangeText={v => set('blood_group', v)} style={{flex:1}} />
        </View>

        <Input label="Monthly Fee (₹)" value={form.monthly_fee} onChangeText={v => set('monthly_fee', v)} keyboardType="numeric" />
        
        <View style={styles.divider} />
        
        <Input label="Parent Name" value={form.parent_name} onChangeText={v => set('parent_name', v)} />
        <Input label="Parent Contact" value={form.parent_contact} onChangeText={v => set('parent_contact', v)} keyboardType="phone-pad" maxLength={10} />

        <Button title="Save Changes" onPress={handleUpdate} loading={loading} style={styles.btn} size="lg" />
        
        {!form.is_active && (
          <Button title="Delete Student" variant="danger" onPress={handleDelete} style={styles.delBtn} size="lg" />
        )}
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
  btn: { marginTop: Spacing.md },
  delBtn: { marginTop: Spacing.lg },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border
  },
  statusText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' }
});
