import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../../theme/tokens';
import AppHeader  from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { parentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

export default function ParentHomeScreen({ navigation }) {
  const { user, logout } = useAuth(); // Parent user { tuitionId, students: [...] }
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Since a parent can have multiple students in the same tuition,
  // we pick the first one as active for now.
  const activeStudent = user?.students?.[0];

  const fetchHome = async () => {
    try {
      setLoading(true);
      const res = await parentAPI.getHome();
      setData(res.data.data);
    } catch (e) {
      console.log('Parent home error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHome();
    }, [])
  );

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Parent Portal" 
        subtitle={activeStudent ? `${activeStudent.name} (Grade ${activeStudent.grade})` : 'Welcome'} 
        right={
          <TouchableOpacity onPress={logout} style={{ padding: 8 }}>
            <Text style={{ color: Colors.danger, fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHome} tintColor={Colors.secondary} />}
      >
        {/* Attendance Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: Colors.success }]}>{data?.attendance_summary?.present || 0}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: Colors.danger }]}>{data?.attendance_summary?.absent || 0}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: Colors.warning }]}>{data?.attendance_summary?.leave || 0}</Text>
              <Text style={styles.statLabel}>Leave</Text>
            </View>
          </View>
        </View>

        {/* Announcements */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Announcements</Text>
        {data?.announcements?.length > 0 ? (
          data.announcements.map(a => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>!</Text>
                <Text style={styles.date}>{formatDate(a.created_at)}</Text>
              </View>
              <Text style={styles.content}>{a.message}</Text>
            </View>
          ))
        ) : (
          <EmptyState icon="--" title="No Announcements" message="Nothing from the tuition right now." />
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  summaryBox: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.bgCardAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardIcon: { fontSize: 18 },
  date: { color: Colors.textMuted, fontSize: FontSize.xs },
  content: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22 },
});
