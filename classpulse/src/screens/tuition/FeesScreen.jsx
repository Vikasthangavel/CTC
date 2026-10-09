import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius, FontWeight } from '../../theme/tokens';
import AppHeader      from '../../components/AppHeader';
import Button         from '../../components/Button';
import Badge          from '../../components/Badge';
import EmptyState     from '../../components/EmptyState';
import SelectModal    from '../../components/SelectModal';
import { feesAPI } from '../../services/api';
import { currentMonth, formatMonth, formatCurrency, getInitials } from '../../utils/formatters';

export default function FeesScreen({ navigation }) {
  const [monthStr, setMonthStr] = useState(currentMonth()); // YYYY-MM
  const [data, setData]         = useState([]);
  const [backendStats, setBackendStats] = useState(null);
  const [loading, setLoading]   = useState(true);

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mStr = m < 10 ? `0${m}` : `${m}`;
      const val = `${y}-${mStr}`;
      options.push({ value: val, label: formatMonth(val) });
    }
    return options;
  }, []);

  const changeMonth = (delta) => {
    const [y, m] = monthStr.split('-').map(v => parseInt(v, 10));
    const newDate = new Date(y, m - 1 + delta, 1);
    
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    if (newDate > currentMonthDate) return;

    const ny = newDate.getFullYear();
    const nm = newDate.getMonth() + 1;
    const nmStr = nm < 10 ? `0${nm}` : `${nm}`;
    setMonthStr(`${ny}-${nmStr}`);
  };

  const isCurrentMonth = monthStr === currentMonth();

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await feesAPI.getByMonth(monthStr);
      const payload = res?.data?.data || {};
      
      let studentList = [];
      if (Array.isArray(payload)) {
        studentList = payload;
      } else if (payload && Array.isArray(payload.students)) {
        studentList = payload.students;
        if (payload.stats) setBackendStats(payload.stats);
      }
      
      setData(studentList);
    } catch (e) {
      console.log('Fees fetch error', e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFees();
    }, [monthStr])
  );

  const handleQuickPay = (studentId, studentName, amount) => {
    Alert.alert(
      'Confirm Payment',
      `Mark fees as paid for ${studentName} for ${formatMonth(monthStr)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await feesAPI.quickPay({ student_id: studentId, month_year: monthStr, amount });
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
    if (backendStats) {
      return {
        collected: backendStats.total_collected || 0,
        pending: backendStats.total_pending || 0,
        total: (backendStats.total_collected || 0) + (backendStats.total_pending || 0),
      };
    }
    let collected = 0;
    let pending   = 0;
    let total     = 0;

    if (Array.isArray(data)) {
      data.forEach(s => {
        const amt = s.amount || s.monthly_fee || 0;
        const st  = s.status || s.fee_status;
        total += amt;
        if (st === 'Paid') collected += amt;
        else pending += amt;
      });
    }

    return { collected, pending, total };
  }, [data, backendStats]);

  const renderItem = ({ item }) => {
    const studentId   = item.student_id || item.id;
    const studentName = item.student_name || item.name || 'Student';
    const amount      = item.amount || item.monthly_fee || 0;
    const feeStatus   = item.status || item.fee_status || 'Unpaid';
    const isPaid      = feeStatus === 'Paid';

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('StudentFees', { student: { id: studentId, name: studentName, monthly_fee: amount } })}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(studentName)}</Text>
          </View>
          <View>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.feeAmount}>{formatCurrency(amount)} / month</Text>
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
              onPress={() => handleQuickPay(studentId, studentName, amount)} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Fee Management" subtitle={formatMonth(monthStr)} />

      {/* Month Navigation Bar */}
      <View style={styles.monthBar}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => changeMonth(-1)}>
          <Text style={styles.stepText}>◄</Text>
        </TouchableOpacity>

        <SelectModal
          value={monthStr}
          options={monthOptions}
          onSelect={setMonthStr}
          placeholder="Select Month"
          style={{ marginBottom: 0, flex: 1 }}
        />

        <TouchableOpacity 
          style={[styles.stepBtn, isCurrentMonth && styles.stepBtnDisabled]} 
          onPress={() => changeMonth(1)}
          disabled={isCurrentMonth}
        >
          <Text style={[styles.stepText, isCurrentMonth && styles.stepTextDisabled]}>►</Text>
        </TouchableOpacity>
      </View>

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
        keyExtractor={item => (item.student_id || item.id).toString()}
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
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepBtn: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: { opacity: 0.3 },
  stepText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: 'bold' },
  stepTextDisabled: { color: Colors.textMuted },
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
