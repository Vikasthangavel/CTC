import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../theme/tokens';

export default function AnalyticsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AnalyticsScreen</Text>
      <Text style={styles.sub}>Phase 2+ will build this screen</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8 },
});
