import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings';

export interface AppSettings {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  themePreference: 'light' | 'dark' | 'system';
  isOnboarded: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  reminderEnabled: true,
  reminderHour: 21,
  reminderMinute: 0,
  themePreference: 'system',
  isOnboarded: false,
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<AppSettings> => {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };
    const jsonValue = JSON.stringify(newSettings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    return newSettings;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};
