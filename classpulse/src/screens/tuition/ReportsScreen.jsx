import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/tokens';
import AppHeader  from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { reportsAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getAll();
      setReports(res.data.data);
    } catch (e) {
      console.log('Reports fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Parent Reports" subtitle="Messages from parents" />

      <FlatList
        data={reports}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReports} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.author}>{item.student_name}</Text>
                <Text style={styles.sub}>From: {item.parent_phone}</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.message}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading && <EmptyState icon="--" title="No Reports" message="You have no messages from parents." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  list: { paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  author: { color: Colors.primaryLight, fontSize: FontSize.md, fontWeight: '600' },
  sub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  date: { color: Colors.textSecondary, fontSize: FontSize.sm },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  message: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22 },
});
