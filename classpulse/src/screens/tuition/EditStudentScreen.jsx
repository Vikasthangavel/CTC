import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Text, FlatList, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../../theme/tokens';
import AppHeader      from '../../components/AppHeader';
import Input          from '../../components/Input';
import Button         from '../../components/Button';
import Badge          from '../../components/Badge';
import EmptyState     from '../../components/EmptyState';
import SelectModal    from '../../components/SelectModal';
import DatePickerModal from '../../components/DatePickerModal';
import { studentsAPI, attendanceAPI } from '../../services/api';

const GRADE_OPTIONS = [
  '1st', '2nd', '3rd', '4th', '5th', '6th', 
  '7th', '8th', '9th', '10th', '11th', '12th'
];

const BLOOD_GROUP_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'
];

export default function EditStudentScreen({ route, navigation }) {
  const student = route.params?.student;

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'attendance'
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
  
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);

  // Date-wise attendance history state
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attLoading, setAttLoading]         = useState(false);

  useEffect(() => {
    if (student?.id && activeTab === 'attendance') {
      fetchAttendanceHistory();
    }
  }, [student?.id, activeTab]);

  const fetchAttendanceHistory = async () => {
    try {
      setAttLoading(true);
      const res = await attendanceAPI.getStudentHistory(student.id);
      setAttendanceLogs(res?.data?.data || []);
    } catch (e) {
      console.log('Error fetching student attendance history', e);
    } finally {
      setAttLoading(false);
    }
  };

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

  // Calculate stats for attendance logs
  const totalDays = attendanceLogs.length;
  const presentCount = attendanceLogs.filter(a => a.status === 'Present').length;
  const absentCount  = attendanceLogs.filter(a => a.status === 'Absent').length;
  const leaveCount   = attendanceLogs.filter(a => a.status === 'Leave').length;
  const attendancePct = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : 'N/A';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        title={student?.name || 'Student Details'}
        subtitle={`Grade ${form.grade}`}
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Done</Text>
          </TouchableOpacity>
        }
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Student Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
          onPress={() => setActiveTab('attendance')}
        >
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
            Attendance ({attendancePct === 'N/A' ? 'Logs' : `${attendancePct}%`})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'info' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Toggle */}
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              Status: <Text style={{color: form.is_active ? Colors.success : Colors.danger}}>{form.is_active ? 'Active' : 'Inactive'}</Text>
            </Text>
            <Button 
              title={form.is_active ? 'Deactivate' : 'Activate'} 
              variant="outline" 
              size="sm"
              onPress={toggleActive} 
            />
          </View>

          <Input label="Student Name" value={form.name} onChangeText={v => set('name', v)} />
          
          <SelectModal 
            label="Grade / Standard" 
            value={form.grade} 
            options={GRADE_OPTIONS} 
            onSelect={v => set('grade', v)} 
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
          
          <Input label="Parent Name" value={form.parent_name} onChangeText={v => set('parent_name', v)} />
          <Input label="Parent Contact" value={form.parent_contact} onChangeText={v => set('parent_contact', v)} keyboardType="phone-pad" maxLength={10} />

          <Button title="Save Changes" onPress={handleUpdate} loading={loading} style={styles.btn} size="lg" />
          
          {!form.is_active && (
            <Button title="Delete Student" variant="danger" onPress={handleDelete} style={styles.delBtn} size="lg" />
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Marked</Text>
              <Text style={styles.summaryVal}>{totalDays}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Present</Text>
              <Text style={[styles.summaryVal, { color: Colors.success }]}>{presentCount}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Absent</Text>
              <Text style={[styles.summaryVal, { color: Colors.danger }]}>{absentCount}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Overall %</Text>
              <Text style={[styles.summaryVal, { color: Colors.primaryLight }]}>
                {attendancePct === 'N/A' ? 'N/A' : `${attendancePct}%`}
              </Text>
            </View>
          </View>

          {attLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={attendanceLogs}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                let variant = 'success';
                if (item.status === 'Absent') variant = 'danger';
                if (item.status === 'Leave') variant = 'warning';

                return (
                  <View style={styles.logCard}>
                    <View>
                      <Text style={styles.logDate}>{item.date}</Text>
                      <Text style={styles.logSession}>{item.session} Session</Text>
                    </View>
                    <Badge label={item.status} variant={variant} />
                  </View>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  title="No Attendance History"
                  message="No attendance records have been marked for this student yet."
                />
              }
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  content: { paddingBottom: Spacing.xxl },
  cancelText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: 'bold' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
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
  statusText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 10, marginBottom: 4 },
  summaryVal: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: 'bold' },
  summaryDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  listContent: { paddingBottom: Spacing.xxl },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  logDate: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  logSession: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
