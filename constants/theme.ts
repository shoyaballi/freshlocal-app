export const colors = {
  // Primary - Olive
  primary: '#3d4a2a',
  primaryDark: '#2b3520',
  primaryLight: '#5a6b42',

  // Background
  background: '#faf7f2',
  backgroundWhite: '#fffdf9',

  // Accent - Saffron
  accent: '#d4940a',
  accentLight: '#f0d68a',
  accentPale: '#fdf6e3',

  // Semantic
  error: '#c45e5e',
  success: '#3a7d44',
  successPale: '#e8f5e9',

  // Neutrals
  grey100: '#f3f4f6',
  grey200: '#e5e7eb',
  grey300: '#d1d5db',
  grey400: '#9ca3af',
  grey500: '#6b7280',
  grey600: '#4b5563',
  grey700: '#374151',

  // Card
  cardBackground: '#ffffff',

  // Text
  textPrimary: '#374151',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',

  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
} as const;

export const fonts = {
  heading: 'PlayfairDisplay_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const theme = {
  colors,
  fonts,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;
export default theme;
