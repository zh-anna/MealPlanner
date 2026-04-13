import { Platform, StyleSheet } from 'react-native';

export const absoluteFill = StyleSheet.absoluteFillObject;
export const hairlineWidth = StyleSheet.hairlineWidth;

export const screenHeader = {
  zIndex: 10,
  elevation: Platform.OS === 'android' ? 6 : undefined,
} as const;

export const accountStickyHeader = {
  zIndex: 20,
  elevation: Platform.OS === 'android' ? 8 : undefined,
} as const;
