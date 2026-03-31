import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Geologica_700Bold,
} from '@expo-google-fonts/geologica';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  MaterialSymbolsRounded_300Light,
  MaterialSymbolsRounded_500Medium,
} from '@expo-google-fonts/material-symbols-rounded';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View } from 'react-native';

import { colors } from '@/constants/tokens';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geologica_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    MaterialSymbolsRounded_300Light,
    MaterialSymbolsRounded_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="replace-meal"
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.cream,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : {}),
            },
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}