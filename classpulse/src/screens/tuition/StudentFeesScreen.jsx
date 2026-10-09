import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../../theme/tokens';
import AppHeader      from '../../components/AppHeader';
import Badge          from '../../components/Badge';
import EmptyState     from '../../components/EmptyState';
import { feesAPI } from '../../services/api';
import { formatMonth, formatCurrency, formatDate } from '../../utils/formatters';

export default function StudentFeesScreen({ route, navigation }) {
  const student = route.params?.student;
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await feesAPI.getStudentFees(student.id);
      setHistory(res.data.data);
    } catch (e) {
      console.log('Student Fees history error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [student.id])
  );

  const renderItem = ({ item }) => {
    const isPaid = item.status === 'Paid';

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.monthText}>{formatMonth(item.month_year)}</Text>
          <Text style={styles.amountText}>{formatCurrency(item.amount || item.amount_paid || 0)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Badge label={item.status} variant={isPaid ? 'success' : 'warning'} />
          {isPaid && item.payment_date && (
            <Text style={styles.dateText}>on {formatDate(item.payment_date)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Fee History" 
        subtitle={student.name}
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Monthly Fee</Text>
        <Text style={styles.infoVal}>{formatCurrency(student.monthly_fee)}</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading && <EmptyState title="No Records" message="No fee history found for this student." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '500' },
  infoBox: {
    backgroundColor: `${Colors.primary}15`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  infoLabel: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '500' },
  infoVal: { color: Colors.primaryLight, fontSize: FontSize.lg, fontWeight: 'bold' },
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
  cardLeft: { justifyContent: 'center' },
  monthText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  amountText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardRight: { alignItems: 'flex-end' },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
});
