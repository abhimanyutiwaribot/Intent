import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { getTodayIntent, IntentRecord, updateIntentStatus } from '../storage/intentStorage';
import { useAppTheme } from './_layout';

export default function CheckInScreen() {
  const router = useRouter();
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;

  const [intent, setIntent] = useState<IntentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [contentOpacity] = useState(new Animated.Value(0));
  const [contentTranslateY] = useState(new Animated.Value(30));

  useEffect(() => {
    const loadIntent = async () => {
      const data = await getTodayIntent();
      if (data) setIntent(data);
      setIsLoading(false);

      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    };
    loadIntent();
  }, []);

  const handleUpdate = async (completed: boolean) => {
    if (intent) {
      await updateIntentStatus(intent.date, completed);
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} hitSlop={20}>
          <X color={theme.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }]
          }
        ]}
      >
        {!isLoading && intent ? (
          <>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Daily Reflection</Text>

            <Text style={[styles.intentText, { color: theme.text }]}>
              {intent.intent}
            </Text>

            <Text style={[styles.question, { color: theme.secondaryText }]}>
              Did you make this happen?
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.circleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleUpdate(false)}
                activeOpacity={0.7}
              >
                <X color={theme.error} size={32} strokeWidth={2.5} />
                <Text style={[styles.buttonLabel, { color: theme.secondaryText }]}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.circleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleUpdate(true)}
                activeOpacity={0.7}
              >
                <Check color={theme.success} size={32} strokeWidth={2.5} />
                <Text style={[styles.buttonLabel, { color: theme.secondaryText }]}>Yes</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            {/* Simple invisible placeholder to maintain layout while loading */}
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  loadingContainer: {
    height: 100,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 24,
  },
  intentText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -1,
    marginBottom: 32,
  },
  question: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 64,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 48,
    alignItems: 'center',
  },
  circleButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  buttonLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
