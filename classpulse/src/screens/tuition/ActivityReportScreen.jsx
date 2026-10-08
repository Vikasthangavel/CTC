import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/tokens';
import AppHeader      from '../../components/AppHeader';
import Button         from '../../components/Button';
import EmptyState     from '../../components/EmptyState';
import { activitiesAPI } from '../../services/api';
import { currentMonth, formatMonth, formatDate } from '../../utils/formatters';

export default function ActivityReportScreen({ route, navigation }) {
  const student = route.params?.student;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  
  // Add new activity state
  const [content, setContent]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await activitiesAPI.getByStudent(student.id, currentMonth());
      setActivities(res.data.data);
    } catch (e) {
      console.log('Activity fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (student) fetchActivities();
    }, [student])
  );

  const handleAdd = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await activitiesAPI.add({ student_id: student.id, content });
      setContent('');
      fetchActivities();
    } catch(err) {
      Alert.alert('Error', 'Failed to save activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Activity', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await activitiesAPI.delete(id);
          fetchActivities();
        } catch(e) {}
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Daily Activities" 
        subtitle={`${student?.name} · ${formatMonth(currentMonth())}`}
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        }
      />

      {/* Add Box */}
      <View style={styles.addBox}>
        <TextInput
          style={styles.input}
          placeholder="Log today's activity (e.g. Completed Math Chap 4)"
          placeholderTextColor={Colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
        />
        <Button 
          title="Log" 
          onPress={handleAdd} 
          loading={submitting} 
          disabled={!content.trim()} 
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={activities}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchActivities} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.delBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading && <EmptyState icon="📝" title="No Activities" message="Log what the student learned today." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  backText:  { color: Colors.primary, fontSize: FontSize.md, fontWeight: '500' },
  addBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
  },
  addBtn: { alignSelf: 'flex-end' },
  list: { paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  date: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  content: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22 },
  delBtn: { fontSize: 16, opacity: 0.7 },
});
