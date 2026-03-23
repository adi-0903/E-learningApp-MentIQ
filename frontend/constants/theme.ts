import { Platform } from 'react-native';

const tintColorLight = '#0f766e'; // Teal 700 - Bloom Primary
const tintColorDark = '#2dd4bf'; // Teal 400

export const Colors = {
  light: {
    primary: '#0f766e', // Teal 700
    primaryLight: '#f0fdfa', // Teal 50
    primaryDark: '#134e4a', // Teal 900
    secondary: '#f43f5e', // Rose 500
    secondaryLight: '#fff1f2', // Rose 50
    background: '#f8fafc', // Slate 50
    surface: '#FFFFFF',
    text: '#0f172a', // Slate 900
    textSecondary: '#475569', // Slate 600
    textLight: '#94a3b8', // Slate 400
    border: '#e2e8f0', // Slate 200
    error: '#ef4444', // Red 500
    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    card: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    divider: '#f1f5f9',
    white: '#FFFFFF',
  },
  dark: {
    primary: '#818CF8', // Indigo 400
    primaryLight: '#312E81', // Indigo 900
    primaryDark: '#C7D2FE', // Indigo 200
    secondary: '#34D399', // Emerald 400
    secondaryLight: '#064E3B', // Emerald 900
    background: '#111827', // Gray 900
    surface: '#1F2937', // Gray 800
    text: '#F9FAFB', // Gray 50
    textSecondary: '#D1D5DB', // Gray 300
    textLight: '#9CA3AF', // Gray 400
    border: '#374151', // Gray 700
    error: '#F87171', // Red 400
    success: '#34D399', // Emerald 400
    warning: '#FBBF24', // Amber 400
    card: '#1F2937',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    divider: '#374151',
    white: '#FFFFFF',
  },
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const AppShadows = {
  small: {
    shadowColor: '#64748B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  light: {
    shadowColor: '#64748B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  medium: {
    shadowColor: '#64748B',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dark: { // For dark mode or heavier shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
};

export const BorderRadius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  circle: 9999,
};

import { TextStyle } from 'react-native';

export const Typography: { [key: string]: TextStyle } = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};

