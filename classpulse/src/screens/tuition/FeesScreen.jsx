import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../../theme/tokens';
import AppHeader      from '../../components/AppHeader';
import Button         from '../../components/Button';
import Badge          from '../../components/Badge';
import EmptyState     from '../../components/EmptyState';
import { feesAPI } from '../../services/api';
import { currentMonth, formatMonth, formatCurrency, getInitials } from '../../utils/formatters';

export default function FeesScreen({ navigation }) {
  const [monthStr, setMonthStr] = useState(currentMonth()); // YYYY-MM
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await feesAPI.getByMonth(monthStr);
      setData(res.data.data);
    } catch (e) {
      console.log('Fees fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFees();
    }, [monthStr])
  );

  const handleQuickPay = (studentId, studentName) => {
    Alert.alert(
      'Confirm Payment',
      `Mark fees as paid for ${studentName} for ${formatMonth(monthStr)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await feesAPI.quickPay({ student_id: studentId, month_year: monthStr });
              fetchFees();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to record payment');
            }
          }
        }
      ]
    );
  };

  const stats = useMemo(() => {
    let collected = 0;
    let pending   = 0;
    let total     = 0;

    data.forEach(s => {
      total += s.monthly_fee;
      if (s.fee_status === 'Paid') collected += s.monthly_fee;
      else pending += s.monthly_fee;
    });

    return { collected, pending, total };
  }, [data]);

  const renderItem = ({ item }) => {
    const isPaid = item.fee_status === 'Paid';

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('StudentFees', { student: item })}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.feeAmount}>{formatCurrency(item.monthly_fee)} / month</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          {isPaid ? (
            <Badge label="Paid" variant="success" />
          ) : (
            <Button 
              title="Collect" 
              size="sm" 
              variant="primary" 
              onPress={() => handleQuickPay(item.id, item.name)} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Fee Management" subtitle={formatMonth(monthStr)} />

      {/* Summary Box */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Collected</Text>
          <Text style={[styles.summaryVal, { color: Colors.success }]}>{formatCurrency(stats.collected)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryVal, { color: Colors.warning }]}>{formatCurrency(stats.pending)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expected</Text>
          <Text style={styles.summaryVal}>{formatCurrency(stats.total)}</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFees} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading && <EmptyState title="No active students" message="Add students to manage fees." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  summaryVal: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
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
  feeAmount: { fontSize: FontSize.sm, color: Colors.textMuted },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
});
