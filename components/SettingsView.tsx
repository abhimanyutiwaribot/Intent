import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, Check, ChevronRight, Clock, HelpCircle, Info, Moon, Sun, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../app/_layout';
import { Colors } from '../constants/Colors';
import { AppSettings, getSettings, saveSettings } from '../storage/settingsStorage';
import { cancelAllReminders, scheduleDailyReminder } from '../utils/notificationUtils';
import CustomAlert from './CustomAlert';
import TimePickerModal from './TimePickerModal';

interface SettingsViewProps {
  onBackPress: () => void;
  onHistoryCleared?: () => void;
}

interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  buttons: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
}

export default function SettingsView({ onHistoryCleared }: SettingsViewProps) {
  const { theme: activeTheme, preference, setThemePreference, setNeedsOnboarding } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const showAlert = (title: string, message: string, buttons: AlertConfig['buttons']) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const handleToggleReminder = async (value: boolean) => {
    if (!settings) return;
    const newSettings = await saveSettings({ reminderEnabled: value });
    setSettings(newSettings);

    if (value) {
      await scheduleDailyReminder(newSettings.reminderHour, newSettings.reminderMinute);
    } else {
      await cancelAllReminders();
    }
  };

  const handleSaveTime = async (hour: number, minute: number) => {
    if (settings) {
      const newSettings = await saveSettings({
        reminderHour: hour,
        reminderMinute: minute
      });
      setSettings(newSettings);
      setShowTimePicker(false);
      if (newSettings.reminderEnabled) {
        await scheduleDailyReminder(hour, minute);
      }
    }
  };

  const handleThemeChange = async (pref: 'light' | 'dark' | 'system') => {
    if (!settings) return;
    const newSettings = await saveSettings({ themePreference: pref });
    setSettings(newSettings);
    setThemePreference(pref);
  };

  const handleClearHistory = () => {
    showAlert(
      "Clear History",
      "Are you sure you want to delete all past intents? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: hideAlert },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('dailyIntents');
            if (onHistoryCleared) onHistoryCleared();
            hideAlert();
            setTimeout(() => {
              showAlert("Success", "History cleared.", [{ text: "OK", onPress: hideAlert }]);
            }, 300);
          }
        }
      ]
    );
  };
  const handleShowOnboarding = async () => {
    await saveSettings({ isOnboarded: false });
    setNeedsOnboarding(true);
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ampm}`;
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Notifications</Text>

          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <Bell size={20} color={theme.text} strokeWidth={2} />
              <Text style={[styles.rowText, { color: theme.text }]}>Enable Daily Reminder</Text>
            </View>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: theme.border, true: theme.text }}
              thumbColor={Platform.OS === 'ios' ? '#FFF' : settings.reminderEnabled ? '#FFF' : '#F4F3F4'}
            />
          </View>

          {settings.reminderEnabled && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.rowLeft}>
                <Clock size={20} color={theme.text} strokeWidth={2} />
                <Text style={[styles.rowText, { color: theme.text }]}>Reminder Time</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: theme.secondaryText }]}>
                  {formatTime(settings.reminderHour, settings.reminderMinute)}
                </Text>
                <ChevronRight size={18} color={theme.secondaryText} />
              </View>
            </TouchableOpacity>
          )}

          <TimePickerModal
            visible={showTimePicker}
            hour={settings.reminderHour}
            minute={settings.reminderMinute}
            onClose={() => setShowTimePicker(false)}
            onSave={handleSaveTime}
            theme={theme}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Appearance</Text>

          {(['light', 'dark', 'system'] as const).map((pref) => (
            <TouchableOpacity
              key={pref}
              style={[styles.row, { borderBottomColor: theme.border }]}
              onPress={() => handleThemeChange(pref)}
            >
              <View style={styles.rowLeft}>
                {pref === 'light' && <Sun size={20} color={theme.text} />}
                {pref === 'dark' && <Moon size={20} color={theme.text} />}
                {pref === 'system' && <View style={styles.systemIcon}><View style={[styles.systemIconHalf, { backgroundColor: '#333' }]} /><View style={[styles.systemIconHalf, { backgroundColor: '#CCC' }]} /></View>}
                <Text style={[styles.rowText, { color: theme.text, textTransform: 'capitalize' }]}>
                  {pref === 'system' ? 'System Default' : pref}
                </Text>
              </View>
              {preference === pref && (
                <Check size={20} color={theme.text} strokeWidth={3} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Data Management</Text>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]} onPress={handleClearHistory}>
            <View style={styles.rowLeft}>
              <Trash2 size={20} color={theme.error} strokeWidth={2} />
              <Text style={[styles.rowText, { color: theme.error }]}>Clear History</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>About</Text>

          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]} onPress={handleShowOnboarding}>
            <View style={styles.rowLeft}>
              <HelpCircle size={20} color={theme.text} strokeWidth={2} />
              <Text style={[styles.rowText, { color: theme.text }]}>Show Walkthrough</Text>
            </View>
            <ChevronRight size={18} color={theme.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <Info size={20} color={theme.text} strokeWidth={2} />
              <Text style={[styles.rowText, { color: theme.text }]}>Version</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: theme.secondaryText }]}>1.0.0</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.secondaryText }]}>Focus on what matters.</Text>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '400',
  },
  systemIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#666',
  },
  systemIconHalf: {
    flex: 1,
  },
  footer: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.6,
  },
});

