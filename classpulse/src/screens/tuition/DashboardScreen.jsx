import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme/tokens';
import AppHeader from '../../components/AppHeader';
import StatCard  from '../../components/StatCard';
import { dashboardAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.get();
      setData(res.data.data);
    } catch (e) {
      console.log('Dashboard error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  return (
    <View style={styles.container}>
      <AppHeader 
        title={user?.name || 'Dashboard'} 
        subtitle="Overview of your tuition" 
        right={
          <TouchableOpacity onPress={logout} style={{ padding: 8 }}>
            <Text style={{ color: Colors.danger, fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} tintColor={Colors.primary} />}
      >
        {/* Stats Row 1 */}
        <View style={styles.statsRow}>
          <StatCard
            label="Active Students"
            value={data?.student_count?.toString() || '0'}
            icon="👨‍🎓"
            color={Colors.primary}
          />
          <StatCard
            label="Paid Fees"
            value={data?.paid_count?.toString() || '0'}
            icon="💳"
            color={Colors.success}
          />
        </View>

        {/* Stats Row 2 */}
        <View style={styles.statsRow}>
          <StatCard
            label="Collected this Month"
            value={formatCurrency(data?.total_collected)}
            icon="💰"
            color={Colors.warning}
          />
        </View>

        {/* Birthdays Section */}
        {data?.birthday_students?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎂 Birthdays This Month</Text>
            {data.birthday_students.map(s => (
              <View key={s.id} style={styles.birthdayCard}>
                <Text style={styles.birthdayText}>{s.name} (Grade {s.grade})</Text>
                <Text style={styles.birthdayDate}>{formatDate(s.dob)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Announcements Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📣 Recent Announcements</Text>
          </View>
          {data?.announcements?.length > 0 ? (
            data.announcements.slice(0, 3).map(a => (
              <View key={a.id} style={styles.listItem}>
                <Text style={styles.listText}>{a.message}</Text>
                <Text style={styles.listSub}>{formatDate(a.created_at)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No announcements sent yet.</Text>
          )}
        </View>

        {/* Reports Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📝 Parent Reports</Text>
            <TouchableOpacity onPress={() => navigation.navigate('More')}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>
          {data?.reports?.length > 0 ? (
            data.reports.slice(0, 3).map(r => (
              <View key={r.id} style={styles.listItem}>
                <View style={styles.listHeader}>
                  <Text style={styles.listAuthor}>{r.student_name}</Text>
                  <Text style={styles.listSub}>{formatDate(r.created_at)}</Text>
                </View>
                <Text style={styles.listText}>{r.message}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No reports from parents.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  birthdayCard: {
    backgroundColor: `${Colors.accent}20`,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  birthdayText: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  birthdayDate: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  listItem: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listAuthor: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  listText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  listSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
});
