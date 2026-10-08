import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme/tokens';
import AppHeader from '../../components/AppHeader';
import Button    from '../../components/Button';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ParentReportScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const activeStudent = user?.students?.[0];

  const handleSubmit = async () => {
    if (!message.trim() || !activeStudent) return;
    setLoading(true);
    try {
      await reportsAPI.submit({ student_id: activeStudent.id, message });
      Alert.alert('Sent', 'Your message has been sent to the tuition admin.');
      setMessage('');
    } catch (err) {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title="Contact Tuition" subtitle="Send a message or report" />
      
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          placeholder="Write your message here (e.g. Leave request, feedback...)"
          placeholderTextColor={Colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
        />
        
        <Button 
          title="Send Message" 
          variant="secondary"
          size="lg" 
          onPress={handleSubmit} 
          loading={loading}
          disabled={!message.trim()}
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  content: { flexGrow: 1, paddingTop: Spacing.md },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    minHeight: 150,
    fontSize: 16,
  },
  btn: { marginTop: Spacing.lg },
});
