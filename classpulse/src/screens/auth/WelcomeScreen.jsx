import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme/tokens';
import Button from '../../components/Button';

// ─────────────────────────────────────────
//  WelcomeScreen — First screen users see
//  Options: Tuition Signup (new) or Login (existing)
// ─────────────────────────────────────────
export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>
          <Text style={styles.appName}>ClassPulse</Text>
          <Text style={styles.tagline}>Smart Tuition Management</Text>
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          {[
            'Manage Students',
            'Track Attendance',
            'Collect Fees',
            'Parent Connect',
          ].map((label) => (
            <View key={label} style={styles.featureItem}>
              <Text style={styles.featureLabel}>• {label}</Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Button
            title="Register Your Tuition"
            variant="primary"
            size="lg"
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('TuitionSignup')}
          />
          <Button
            title="Login"
            variant="outline"
            size="lg"
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Login')}
          />
        </View>

        <Text style={styles.footerText}>Powered by ClassPulse · Multi-Tuition Platform</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bg,
  },
  circle1: {
    width:    300,
    height:   300,
    top:     -100,
    right:   -100,
    backgroundColor: `${Colors.primary}15`,
  },
  circle2: {
    width:    200,
    height:   200,
    bottom:  -60,
    left:    -60,
    backgroundColor: `${Colors.secondary}10`,
  },
  circle: {
    position:     'absolute',
    borderRadius: 999,
  },
  content: {
    flexGrow:       1,
    justifyContent: 'center',
    padding:        Spacing.xl,
    paddingTop:     Spacing.xxl + 20,
  },
  logoArea: {
    alignItems:   'center',
    marginBottom: Spacing.xxl,
  },
  logoBox: {
    width:           88,
    height:          88,
    borderRadius:    BorderRadius.xl,
    backgroundColor: `${Colors.primary}30`,
    borderWidth:     2,
    borderColor:     `${Colors.primary}60`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    fontSize:   FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize:   FontSize.md,
    color:      Colors.textMuted,
    marginTop:  Spacing.xs,
  },
  features: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'center',
    gap:            Spacing.sm,
    marginBottom:   Spacing.xxl,
  },
  featureItem: {
    backgroundColor: Colors.bgCard,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.sm,
    alignItems:      'center',
    width:           '44%',
    gap:             4,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureLabel: {
    fontSize:  FontSize.sm,
    color:     Colors.textSecondary,
    fontWeight:'500',
    textAlign: 'center',
  },
  actions: {
    gap:          Spacing.md,
    marginBottom: Spacing.xl,
  },
  btnPrimary: {
    width: '100%',
  },
  btnSecondary: {
    width: '100%',
  },
  footerText: {
    fontSize:  FontSize.xs,
    color:     Colors.textMuted,
    textAlign: 'center',
  },
});
