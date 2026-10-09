import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/tokens';
import AppHeader  from '../../components/AppHeader';
import Badge      from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { feesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatMonth, formatCurrency, formatDate } from '../../utils/formatters';

export default function ParentFeesScreen() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeStudent = user?.students?.[0];

  const fetchHistory = async () => {
    if (!activeStudent) return;
    try {
      setLoading(true);
      const res = await feesAPI.getStudentFees(activeStudent.id);
      setHistory(res.data.data);
    } catch (e) {
      console.log('Parent fee history error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Fee Status" subtitle="Payment History" />

      <FlatList
        data={history}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} tintColor={Colors.secondary} />}
        renderItem={({ item }) => {
          const isPaid = item.status === 'Paid';
          return (
            <View style={styles.card}>
              <View>
                <Text style={styles.monthText}>{formatMonth(item.month_year)}</Text>
                <Text style={styles.amountText}>{formatCurrency(item.amount_paid)}</Text>
              </View>
              <View style={styles.right}>
                <Badge label={item.status} variant={isPaid ? 'success' : 'warning'} />
                {isPaid && item.payment_date && (
                  <Text style={styles.dateText}>on {formatDate(item.payment_date)}</Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading && <EmptyState icon="--" title="No Fee Records" message="Tuition hasn't tracked any fees yet." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  list: { paddingBottom: Spacing.xxl },
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
  monthText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  amountText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  right: { alignItems: 'flex-end' },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
});
