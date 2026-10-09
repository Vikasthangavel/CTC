import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/tokens';
import AppHeader   from '../../components/AppHeader';
import StudentCard from '../../components/StudentCard';
import Input       from '../../components/Input';
import EmptyState  from '../../components/EmptyState';
import { studentsAPI } from '../../services/api';

export default function StudentsScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentsAPI.getAll(showInactive);
      setStudents(res.data.data);
    } catch (e) {
      console.log('Error fetching students', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [showInactive])
  );

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.parent_contact.includes(q) ||
      s.grade.toString() === q
    );
  }, [students, search]);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Students"
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddStudent')}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.toolbar}>
        <Input
          placeholder="Search by name, phone or grade..."
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <TouchableOpacity
          style={[styles.filterBtn, showInactive && styles.filterBtnActive]}
          onPress={() => setShowInactive(!showInactive)}
        >
          <Text style={[styles.filterText, showInactive && styles.filterTextActive]}>
            {showInactive ? 'All' : 'Active'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStudents} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => navigation.navigate('EditStudent', { student: item })}
          />
        )}
        ListEmptyComponent={
          !loading && <EmptyState
            icon="--"
            title="No Students Found"
            message={search ? "Try adjusting your search" : "Add your first student to get started"}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
  },
  toolbar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
  },
  filterBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
});
