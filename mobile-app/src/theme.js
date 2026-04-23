export const COLORS = {
  // Primary colors
  tealStrong: '#0D7F6F',
  tealBright: '#00BFA5',
  tealLight: '#4DD0E1',
  tealPale: '#B2DFDB',
  tealFaint: '#E0F2F1',

  // Neutral colors
  white: '#FFFFFF',
  navyDeep: '#1A1A2E',
  navyMid: '#16213E',
  bgPage: '#F8FAFC',
  bgMuted: '#F1F5F9',

  // Text colors
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textPlaceholder: '#CBD5E1',

  // Status colors
  success: '#10B981',
  successBg: '#D1FAE5',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  warning: '#F59E0B',

  // UI elements
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputFocus: '#0D7F6F',
  divider: '#E2E8F0',
  link: '#0D7F6F',
  security: '#64748B',
};

export const FONTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const RADIUS = {
  md: 8,
  lg: 12,
  full: 9999,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btn: {
    shadowColor: '#0D7F6F',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
};

export const statusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'approved':
    case 'completed':
      return { text: COLORS.success, bg: COLORS.successBg };
    case 'pending':
      return { text: COLORS.warning, bg: '#FEF3C7' };
    case 'cancelled':
    case 'rejected':
      return { text: COLORS.danger, bg: COLORS.dangerBg };
    default:
      return { text: COLORS.textMuted, bg: COLORS.bgMuted };
  }
};
