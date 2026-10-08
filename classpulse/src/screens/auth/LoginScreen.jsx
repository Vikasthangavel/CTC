import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme/tokens';
import Input  from '../../components/Input';
import Button from '../../components/Button';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────
//  LoginScreen
//  Two tabs: Tuition Admin login | Parent login
//  Parent login also needs to select their tuition center
// ─────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const { loginTuitionAdmin, loginParent } = useAuth();

  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'parent'
  const [loading,   setLoading]   = useState(false);

  // Admin form
  const [adminForm, setAdminForm] = useState({ phone: '', password: '' });
  const [adminErrors, setAdminErrors] = useState({});
  const [apiError, setApiError]       = useState('');

  // Parent form
  const [parentForm,   setParentForm]   = useState({ phone: '', tuitionId: '', tuitionName: '' });
  const [parentErrors, setParentErrors] = useState({});
  const [tuitionSearch, setTuitionSearch]   = useState('');
  const [tuitionResults, setTuitionResults] = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);

  // ── Admin login ───────────────────────
  function setAdmin(field, value) {
    setAdminForm(p => ({ ...p, [field]: value }));
    if (adminErrors[field]) setAdminErrors(p => ({ ...p, [field]: '' }));
    setApiError('');
  }

  async function handleAdminLogin() {
    const e = {};
    if (!adminForm.phone)    e.phone    = 'Phone is required';
    if (!adminForm.password) e.password = 'Password is required';
    setAdminErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      const res = await authAPI.login(adminForm);
      const { token, tuition } = res.data.data;
      await loginTuitionAdmin(token, tuition);
    } catch (err) {
      // If it's an Axios error from the backend, it has err.response
      // Otherwise it's a code/React error and has err.message
      const msg = err?.response?.data?.message || err.message || 'Login failed.';
      setApiError(msg);
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Tuition search (for parent login) ─
  async function searchTuitions(text) {
    setTuitionSearch(text);
    setParentForm(p => ({ ...p, tuitionId: '', tuitionName: '' }));
    if (text.length < 2) { setTuitionResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await authAPI.searchTuitions(text);
      setTuitionResults(res.data.data || []);
    } catch {
      setTuitionResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function selectTuition(t) {
    setParentForm(p => ({ ...p, tuitionId: t.id, tuitionName: t.name }));
    setTuitionSearch(t.name);
    setTuitionResults([]);
  }

  // ── Parent login ──────────────────────
  async function handleParentLogin() {
    const e = {};
    if (!parentForm.phone)     e.phone     = 'Phone is required';
    if (!parentForm.tuitionId) e.tuitionId = 'Please select your tuition center';
    setParentErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const res = await authAPI.parentLogin({
        phone:      parentForm.phone,
        tuition_id: parentForm.tuitionId,
      });
      const { token, students } = res.data.data;
      await loginParent(token, { students, tuitionId: parentForm.tuitionId });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to ClassPulse</Text>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'admin' && styles.activeTab]}
            onPress={() => setActiveTab('admin')}
          >
            <Text style={[styles.tabText, activeTab === 'admin' && styles.activeTabText]}>🏫 Tuition Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'parent' && styles.activeTab]}
            onPress={() => setActiveTab('parent')}
          >
            <Text style={[styles.tabText, activeTab === 'parent' && styles.activeTabText]}>👨‍👩‍👧 Parent</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Form */}
        {activeTab === 'admin' && (
          <View style={styles.form}>
            <Input
              label="Phone Number"
              placeholder="Registered phone number"
              value={adminForm.phone}
              onChangeText={v => setAdmin('phone', v)}
              keyboardType="phone-pad"
              maxLength={10}
              error={adminErrors.phone}
            />
            <Input
              label="Password"
              placeholder="Your password"
              value={adminForm.password}
              onChangeText={v => setAdmin('password', v)}
              secureTextEntry
              error={adminErrors.password}
            />
            {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}
            <Button title="Login as Admin" onPress={handleAdminLogin} loading={loading} size="lg" style={styles.submitBtn} />
          </View>
        )}

        {/* Parent Form */}
        {activeTab === 'parent' && (
          <View style={styles.form}>
            <Input
              label="Your Phone Number"
              placeholder="Phone number registered at tuition"
              value={parentForm.phone}
              onChangeText={v => setParentForm(p => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
              maxLength={10}
              error={parentErrors.phone}
            />

            {/* Tuition search */}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={styles.label}>Select Your Tuition *</Text>
              <Input
                placeholder="Search tuition by name or phone..."
                value={tuitionSearch}
                onChangeText={searchTuitions}
                inputStyle={{ marginBottom: 0 }}
              />
              {parentErrors.tuitionId && <Text style={styles.errorText}>{parentErrors.tuitionId}</Text>}

              {tuitionResults.length > 0 && (
                <View style={styles.dropdown}>
                  {tuitionResults.map(t => (
                    <TouchableOpacity key={t.id} style={styles.dropdownItem} onPress={() => selectTuition(t)}>
                      <Text style={styles.dropdownName}>{t.name}</Text>
                      <Text style={styles.dropdownSub}>{t.address || t.phone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {parentForm.tuitionId ? (
                <View style={styles.selectedTuition}>
                  <Text style={styles.selectedText}>✅ {parentForm.tuitionName}</Text>
                </View>
              ) : null}
            </View>

            <Button title="Login as Parent" onPress={handleParentLogin} loading={loading} size="lg" style={styles.submitBtn} />
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('TuitionSignup')}>
          <Text style={styles.signupLink}>New tuition? <Text style={styles.link}>Register here</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  content:     { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.xl + 20 },
  back:        { marginBottom: Spacing.lg },
  backText:    { color: Colors.primary, fontSize: FontSize.md, fontWeight: '500' },
  title:       { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle:    { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  tabs: {
    flexDirection:   'row',
    backgroundColor: Colors.bgCard,
    borderRadius:    BorderRadius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.xl,
    padding:         4,
  },
  tab: {
    flex:            1,
    paddingVertical: Spacing.sm,
    alignItems:      'center',
    borderRadius:    BorderRadius.sm,
  },
  activeTab:     { backgroundColor: Colors.primary },
  tabText:       { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  activeTabText: { color: Colors.textPrimary, fontWeight: '600' },
  form:          { marginBottom: Spacing.lg },
  apiError:      { color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.sm, textAlign: 'center' },
  label:         { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
  submitBtn:     { marginTop: Spacing.md, width: '100%' },
  dropdown: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.md,
    marginTop:       4,
    overflow:        'hidden',
  },
  dropdownItem: {
    padding:          Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownName: { color: Colors.textPrimary, fontWeight: '600', fontSize: FontSize.sm },
  dropdownSub:  { color: Colors.textMuted,   fontSize: FontSize.xs, marginTop: 2 },
  selectedTuition: {
    backgroundColor: `${Colors.success}15`,
    borderRadius:    BorderRadius.sm,
    padding:         Spacing.sm,
    marginTop:       Spacing.xs,
  },
  selectedText:  { color: Colors.success, fontSize: FontSize.sm, fontWeight: '500' },
  errorText:     { color: Colors.danger, fontSize: FontSize.xs, marginTop: 4 },
  signupLink:    { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  link:          { color: Colors.primary, fontWeight: '600' },
});
