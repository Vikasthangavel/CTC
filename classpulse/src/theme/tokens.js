// Design Tokens for ClassPulse
// ─────────────────────────────────────────
// All colors, spacing, typography and shadow values
// used across the entire app are defined here.
// Import this file wherever you need styling constants.

export const Colors = {
  // Brand
  primary:       '#2563eb',
  primaryLight:  '#eff6ff',
  primaryDark:   '#1d4ed8',

  secondary:     '#0284c7',
  secondaryLight:'#f0f9ff',

  accent:        '#d97706',

  // Status
  success:       '#16a34a',
  successLight:  '#f0fdf4',
  warning:       '#d97706',
  warningLight:  '#fffbeb',
  danger:        '#dc2626',
  dangerLight:   '#fef2f2',
  info:          '#0284c7',

  // Backgrounds
  bg:            '#f8fafc',
  bgCard:        '#ffffff',
  bgCardAlt:     '#f1f5f9',
  bgSurface:     '#ffffff',

  // Text
  textPrimary:   '#1e293b',
  textSecondary: '#64748b',
  textMuted:     '#94a3b8',
  textInverse:   '#ffffff',

  // Borders
  border:        '#e2e8f0',
  borderLight:   '#f1f5f9',

  // Gradients (use as array for LinearGradient)
  gradientPrimary:   ['#2563eb', '#1d4ed8'],
  gradientSecondary: ['#0284c7', '#0369a1'],
  gradientDark:      ['#f1f5f9', '#f8fafc'],
  gradientCard:      ['#ffffff', '#ffffff'],
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 36,
};

export const FontWeight = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
};

export const BorderRadius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
};
