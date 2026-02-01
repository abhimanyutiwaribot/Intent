import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, useColorScheme as useNativeColorScheme, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { getSettings } from '../storage/settingsStorage';
import { checkHasPermission, requestPermissions, scheduleDailyReminder, scheduleMorningReminderOnly } from '../utils/notificationUtils';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  preference: 'light' | 'dark' | 'system';
  setThemePreference: (pref: 'light' | 'dark' | 'system') => void;
  setNeedsOnboarding: (val: boolean) => void;
}>({
  theme: 'light',
  preference: 'system',
  setThemePreference: () => { },
  setNeedsOnboarding: () => { },
});

export const useAppTheme = () => useContext(ThemeContext);

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) * 1.2;

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const nativeColorScheme = useNativeColorScheme() || 'light';

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
  });

  const [preference, setPreference] = useState<'light' | 'dark' | 'system'>('system');
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(nativeColorScheme);
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [overlayColor, setOverlayColor] = useState('#000');

  useEffect(() => {
    async function init() {
      try {
        const settings = await getSettings();

        setPreference(settings.themePreference);
        const initialTheme = settings.themePreference === 'system' ? nativeColorScheme : settings.themePreference;
        setActiveTheme(initialTheme);
        setNeedsOnboarding(!settings.isOnboarded);

        setIsReady(true);

        if (settings.reminderEnabled) {
          await scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);
        } else {
          // If night reminder is OFF, we still try to schedule the "Universal" morning one
          // but only if we already have permission (so we don't trigger a popup).
          const hasPermission = await checkHasPermission();
          if (hasPermission) {
            await scheduleMorningReminderOnly();
          }
        }
      } catch (e) {
        console.error("Layout Init Error:", e);
        setIsReady(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!isReady || needsOnboarding === null) return;

    const inOnboardingGroup = segments[0] === 'onboarding';

    if (needsOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding');
    } else if (!needsOnboarding && inOnboardingGroup) {
      router.replace('/');
    }
  }, [isReady, needsOnboarding, segments]);

  useEffect(() => {
    if (preference === 'system') {
      triggerThemeAnimation(nativeColorScheme);
    }
  }, [nativeColorScheme]);

  const triggerThemeAnimation = (newTheme: 'light' | 'dark') => {
    if (newTheme === activeTheme) return;
    setOverlayColor(Colors[newTheme].background);
    scaleAnim.setValue(0);
    opacityAnim.setValue(1);
    Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => { scaleAnim.setValue(0); });
      }
    });
    setTimeout(() => { setActiveTheme(newTheme); }, 350);
  };

  const setThemePreference = (pref: 'light' | 'dark' | 'system') => {
    setPreference(pref);
    const newTheme = pref === 'system' ? (nativeColorScheme || 'light') : pref;
    triggerThemeAnimation((newTheme === 'dark' || newTheme === 'light') ? newTheme : 'light');
  };

  const themeValues = Colors[activeTheme] || Colors.light;

  useEffect(() => {
    if (isReady && fontsLoaded && needsOnboarding !== null) {
      SplashScreen.hideAsync();
    }
  }, [isReady, fontsLoaded, needsOnboarding]);

  if (!fontsLoaded || !isReady || needsOnboarding === null) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, preference, setThemePreference, setNeedsOnboarding }}>
      <View style={[styles.container, { backgroundColor: themeValues.background }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: themeValues.background }
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="check-in"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
        </Stack>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.circleOverlay,
            {
              backgroundColor: overlayColor,
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim }
              ]
            }
          ]}
        />

        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circleOverlay: {
    position: 'absolute',
    top: height / 2 - CIRCLE_SIZE / 2,
    left: width / 2 - CIRCLE_SIZE / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    zIndex: 9999,
  }
});