import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../../theme/tokens';
import AppHeader      from '../../components/AppHeader';
import Button         from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState     from '../../components/EmptyState';
import { attendanceAPI } from '../../services/api';
import { today, getInitials } from '../../utils/formatters';

export default function AttendanceScreen({ navigation }) {
  const [date, setDate]       = useState(today());
  const [session, setSession] = useState('Evening'); // 'Morning' or 'Evening'
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  // Tracks edits: { student_id: 'Present' | 'Absent' | 'Leave' }
  const [attendanceState, setAttendanceState] = useState({});

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.getByDate(date, session);
      const fetchedStudents = res.data.data;
      
      // Initialize state map based on fetched data
      const stateMap = {};
      fetchedStudents.forEach(s => {
        stateMap[s.id] = s.status || 'Present'; // default to Present if unmarked
      });
      
      setStudents(fetchedStudents);
      setAttendanceState(stateMap);
    } catch (e) {
      console.log('Attendance fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAttendance();
    }, [date, session])
  );

  const toggleStatus = (id) => {
    setAttendanceState(prev => {
      const current = prev[id];
      let next = 'Present';
      if (current === 'Present') next = 'Absent';
      else if (current === 'Absent') next = 'Leave';
      return { ...prev, [id]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date,
        session,
        attendance: Object.entries(attendanceState).map(([id, status]) => ({
          student_id: parseInt(id, 10),
          status
        }))
      };
      await attendanceAPI.saveBulk(payload);
      Alert.alert('Success', 'Attendance saved successfully!');
      fetchAttendance();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    let present = 0, absent = 0, leave = 0;
    Object.values(attendanceState).forEach(v => {
      if (v === 'Present') present++;
      if (v === 'Absent') absent++;
      if (v === 'Leave') leave++;
    });
    return { present, absent, leave, total: students.length };
  }, [attendanceState, students]);

  const renderItem = ({ item }) => {
    const status = attendanceState[item.id] || 'Present';
    let dotColor = Colors.success;
    if (status === 'Absent') dotColor = Colors.danger;
    if (status === 'Leave') dotColor = Colors.warning;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7} 
        onPress={() => toggleStatus(item.id)}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentGrade}>Grade {item.grade}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.statusText, { color: dotColor }]}>{status}</Text>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Attendance" subtitle={`${date} · ${session}`} />

      {/* Date & Session Toggle Placeholder (Can be expanded to a DatePicker) */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setSession(session === 'Morning' ? 'Evening' : 'Morning')}>
          <Text style={styles.toggleText}>{session} Session</Text>
        </TouchableOpacity>
        <Text style={styles.statsText}>
          <Text style={{color: Colors.success}}>{stats.present} P</Text> ·{' '}
          <Text style={{color: Colors.danger}}>{stats.absent} A</Text> ·{' '}
          <Text style={{color: Colors.warning}}>{stats.leave} L</Text>
        </Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAttendance} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading && <EmptyState title="No active students" message="Add students to start tracking attendance." />
        }
      />

      {students.length > 0 && (
        <View style={styles.footer}>
          <Button title="Save Attendance" size="lg" onPress={handleSave} loading={saving} style={{width: '100%'}} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  toggleText: { color: Colors.textPrimary, fontWeight: '600' },
  statsText: { fontWeight: 'bold', fontSize: FontSize.md },
  list: { paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}25`,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { color: Colors.primaryLight, fontWeight: 'bold' },
  studentName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  studentGrade: { fontSize: FontSize.sm, color: Colors.textMuted },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusText: { fontWeight: '600', fontSize: FontSize.sm },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
