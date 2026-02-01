import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, History, Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../app/_layout';
import { Colors } from '../constants/Colors';
import { getTodayIntent, IntentRecord, saveTodayIntent } from '../storage/intentStorage';
import { formatDate, getTodayDateString } from '../utils/dateUtils';
import IntentInput from './IntentInput';
import PrimaryButton from './PrimaryButton';
import Skeleton from './Skeleton';
import CustomAlert from './CustomAlert';
import { getSettings, saveSettings } from '../storage/settingsStorage';
import { requestPermissions, scheduleDailyReminder } from '../utils/notificationUtils';

interface TodayViewProps {
  onHistoryPress: () => void;
  onSettingsPress: () => void;
  onSettingsUpdate?: () => void;
  refreshKey?: number;
}

export default function TodayView({ onHistoryPress, onSettingsPress, onSettingsUpdate, refreshKey }: TodayViewProps) {
  const router = useRouter();
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;

  const [intent, setIntent] = useState<string>('');
  const [savedIntent, setSavedIntent] = useState<IntentRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showReminderPrompt, setShowReminderPrompt] = useState(false);

  const loadTodayData = async () => {
    setIsLoading(true);
    const dataPromise = getTodayIntent();
    const delayPromise = new Promise(resolve => setTimeout(resolve, 400));
    const [todayData] = await Promise.all([dataPromise, delayPromise]);

    if (todayData) {
      setSavedIntent(todayData);
      setIntent(todayData.intent);
    } else {
      setSavedIntent(null);
      setIntent('');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTodayData();
  }, [refreshKey]);

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
    }, [])
  );

  // Auto-refresh when app comes to foreground or at midnight
  useEffect(() => {
    let lastDate = getTodayDateString();

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        const currentDate = getTodayDateString();
        if (currentDate !== lastDate) {
          lastDate = currentDate;
          loadTodayData();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Midnight check
    const now = new Date();
    const tonight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Tomorrow
      0, 0, 0 // Midnight
    );
    const msToMidnight = tonight.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      loadTodayData();
      // Re-run the effect to set the next midnight timer
      lastDate = getTodayDateString();
    }, msToMidnight + 1000); // Add 1s buffer

    return () => {
      subscription.remove();
      clearTimeout(midnightTimer);
    };
  }, []);

  const handleSave = async () => {
    if (!intent.trim()) return;
    Keyboard.dismiss();
    const newRecord = await saveTodayIntent(intent);
    if (newRecord) {
      setSavedIntent(newRecord);

      // Check for first-time reminder prompt with a slight delay for better UX
      const settings = await getSettings();
      if (!settings.hasSeenReminderPrompt) {
        setTimeout(() => {
          setShowReminderPrompt(true);
        }, 4000);
      }
    }
  };

  const handleEnableReminder = async () => {
    setShowReminderPrompt(false);
    const granted = await requestPermissions();
    if (granted) {
      const settings = await saveSettings({
        reminderEnabled: true,
        hasSeenReminderPrompt: true
      });
      await scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);
      if (onSettingsUpdate) onSettingsUpdate();
    } else {
      await saveSettings({ hasSeenReminderPrompt: true });
      if (onSettingsUpdate) onSettingsUpdate();
    }
  };

  const handleSkipReminder = async () => {
    setShowReminderPrompt(false);
    await saveSettings({ hasSeenReminderPrompt: true });
    if (onSettingsUpdate) onSettingsUpdate();
  };

  if (isLoading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={100} height={20} borderRadius={4} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <View style={styles.content}>
        <View style={styles.fullWidth}>
          <Skeleton width="80%" height={32} borderRadius={8} style={{ marginBottom: 12 }} />
          <Skeleton width="60%" height={32} borderRadius={8} style={{ marginBottom: 40 }} />
          <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 32 }} />
          <Skeleton width="100%" height={56} borderRadius={16} />
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSettingsPress} hitSlop={20}>
          <Settings color={theme.text} size={24} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[styles.dateText, { color: theme.secondaryText }]}>
          {formatDate(getTodayDateString())}
        </Text>

        <TouchableOpacity onPress={onHistoryPress} hitSlop={20}>
          <History color={theme.text} size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {!savedIntent ? (
            <View style={styles.fullWidth}>
              <Text style={[styles.promptText, { color: theme.text }]}>
                What’s the ONE thing that matters today?
              </Text>
              <IntentInput
                value={intent}
                onChangeText={setIntent}
              />
              <PrimaryButton
                title="Focus on this"
                onPress={handleSave}
                disabled={!intent.trim()}
              />
            </View>
          ) : (
            <View style={styles.savedContainer}>
              <Text style={[styles.todayLabel, { color: theme.secondaryText }]}>Today’s Intent</Text>
              <Text style={[styles.savedIntentText, { color: theme.text }]}>{savedIntent.intent}</Text>

              {savedIntent.completed === null ? (
                <>
                  <TouchableOpacity
                    style={[styles.checkInButton, { backgroundColor: theme.text }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      router.push('/check-in');
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.checkInText, { color: theme.background }]}>Check In</Text>
                    <ArrowRight color={theme.background} size={18} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setSavedIntent(null)}
                    hitSlop={10}
                  >
                    <Text style={[styles.editButtonText, { color: theme.secondaryText }]}>Edit Intent</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: theme.card }]}>
                    <Text style={[styles.statusText, { color: savedIntent.completed ? theme.success : theme.error }]}>
                      {savedIntent.completed ? "Completed" : "Not Completed"}
                    </Text>
                  </View>
                  <Text style={[styles.reflectionText, { color: theme.secondaryText }]}>
                    {savedIntent.completed
                      ? "Good job. See you tomorrow."
                      : "It’s okay. Tomorrow is a new start."
                    }
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={showReminderPrompt}
        title="Stay Focused"
        message="Would you like a reminder tonight to check in on your intent?"
        onClose={handleSkipReminder}
        buttons={[
          {
            text: "Not Now",
            style: "cancel",
            onPress: handleSkipReminder
          },
          {
            text: "Enable Reminder",
            style: "default",
            onPress: handleEnableReminder
          }
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
    alignItems: 'center',
  },
  promptText: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  savedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  todayLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  savedIntentText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 40,
    letterSpacing: -1,
  },
  editButton: {
    marginTop: 24,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textDecorationLine: 'underline',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 60,
    paddingHorizontal: 36,
    borderRadius: 30, // Full pill
    marginTop: 8,
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  checkInText: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 32,
    marginTop: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.2,
  },
  reflectionText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
    textAlign: 'center',
  }
});
