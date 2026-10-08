import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme/tokens';
import Input  from '../../components/Input';
import Button from '../../components/Button';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────
//  TuitionSignupScreen — Register a new tuition center
// ─────────────────────────────────────────
export default function TuitionSignupScreen({ navigation }) {
  const { loginTuitionAdmin } = useAuth();

  const [form, setForm]     = useState({
    name:     '',
    phone:    '',
    email:    '',
    password: '',
    address:  '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const [apiError, setApiError] = useState('');

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  }

  function validate() {
    const e = {};
    if (!form.name.trim())     e.name     = 'Tuition name is required';
    if (!form.phone.trim())    e.phone    = 'Phone number is required';
    if (form.phone.length < 10) e.phone   = 'Enter a valid phone number';
    if (!form.password.trim()) e.password = 'Password is required';
    if (form.password.length < 4) e.password = 'Password must be at least 4 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup() {
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    try {
      const res = await authAPI.signup(form);
      const { token, tuition } = res.data.data;
      await loginTuitionAdmin(token, tuition);
      // Navigation happens automatically via AppNavigator
    } catch (err) {
      const msg = err?.response?.data?.message || 'Signup failed. Please try again.';
      setApiError(msg);
      Alert.alert('Signup Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Register Your Tuition</Text>
          <Text style={styles.subtitle}>Create your ClassPulse account to manage your students</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Tuition / Center Name *"
            placeholder="e.g. Bright Minds Academy"
            value={form.name}
            onChangeText={v => set('name', v)}
            error={errors.name}
          />
          <Input
            label="Phone Number *"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChangeText={v => set('phone', v)}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />
          <Input
            label="Email (optional)"
            placeholder="youremail@example.com"
            value={form.email}
            onChangeText={v => set('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password *"
            placeholder="Create a password (min 4 chars)"
            value={form.password}
            onChangeText={v => set('password', v)}
            secureTextEntry
            error={errors.password}
          />
          <Input
            label="Address (optional)"
            placeholder="Tuition address"
            value={form.address}
            onChangeText={v => set('address', v)}
            multiline
            numberOfLines={2}
          />

          {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Already have an account? <Text style={styles.link}>Login</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bg,
  },
  content: {
    flexGrow: 1,
    padding:  Spacing.xl,
    paddingTop: Spacing.xl + 20,
  },
  back: {
    marginBottom: Spacing.lg,
  },
  backText: {
    color:    Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  titleArea: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color:    Colors.textMuted,
    lineHeight: 20,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  apiError: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: Spacing.md,
    width:     '100%',
  },
  loginLink: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'center',
  },
  link: {
    color:      Colors.primary,
    fontWeight: '600',
  },
});
