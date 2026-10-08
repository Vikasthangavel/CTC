// Design Tokens for ClassPulse
// ─────────────────────────────────────────
// All colors, spacing, typography and shadow values
// used across the entire app are defined here.
// Import this file wherever you need styling constants.

export const Colors = {
  // Brand
  primary:       '#6C5CE7',   // Deep violet
  primaryLight:  '#A29BFE',
  primaryDark:   '#5A4FCF',

  secondary:     '#00CEC9',   // Teal accent
  secondaryLight:'#81ECEC',

  accent:        '#FDCB6E',   // Warm yellow

  // Status
  success:       '#00B894',
  successLight:  '#D4EFDF',
  warning:       '#FDCB6E',
  warningLight:  '#FEF9E7',
  danger:        '#E17055',
  dangerLight:   '#FDECEA',
  info:          '#74B9FF',

  // Backgrounds
  bg:            '#0F0E17',   // Very dark (near black) background
  bgCard:        '#1A1928',   // Slightly lighter card background
  bgCardAlt:     '#211F35',
  bgSurface:     '#2A2840',

  // Text
  textPrimary:   '#FFFFFE',
  textSecondary: '#A8A6C0',
  textMuted:     '#5E5B7E',
  textInverse:   '#0F0E17',

  // Borders
  border:        '#2E2C4A',
  borderLight:   '#3A3858',

  // Gradients (use as array for LinearGradient)
  gradientPrimary:   ['#6C5CE7', '#A29BFE'],
  gradientSecondary: ['#00CEC9', '#81ECEC'],
  gradientDark:      ['#1A1928', '#0F0E17'],
  gradientCard:      ['#211F35', '#1A1928'],
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
