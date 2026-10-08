import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/tokens';
import AppHeader  from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { parentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { currentMonth, formatMonth, formatDate } from '../../utils/formatters';

export default function ParentActivityScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);

  const activeStudent = user?.students?.[0];

  const fetchActivities = async () => {
    if (!activeStudent) return;
    try {
      setLoading(true);
      const res = await parentAPI.getActivities(activeStudent.id, currentMonth());
      setActivities(res.data.data);
    } catch (e) {
      console.log('Parent activity error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [])
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Daily Activities" subtitle={formatMonth(currentMonth())} />

      <FlatList
        data={activities}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchActivities} tintColor={Colors.secondary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading && <EmptyState icon="📚" title="No Activities logged" message="Tuition admin hasn't logged anything for this month yet." />
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
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  date: { color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 4 },
  content: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22 },
});
