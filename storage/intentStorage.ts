import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayDateString } from '../utils/dateUtils';

const STORAGE_KEY = 'dailyIntents';

export interface IntentRecord {
  date: string;
  intent: string;
  completed: boolean | null;
}

export const getIntents = async (): Promise<IntentRecord[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    let intents: IntentRecord[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    const today = getTodayDateString();
    let hasChanges = false;

    // Auto-mark missed check-ins from previous days as Not Completed (false)
    intents = intents.map(item => {
      if (item.date !== today && item.completed === null) {
        hasChanges = true;
        return { ...item, completed: false };
      }
      return item;
    });

    if (hasChanges) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(intents));
    }

    return intents;
  } catch (e) {
    console.error('Error fetching intents', e);
    return [];
  }
};

export const getTodayIntent = async (): Promise<IntentRecord | undefined> => {
  const intents = await getIntents();
  const today = getTodayDateString();
  return intents.find((item) => item.date === today);
};

export const saveTodayIntent = async (intentText: string): Promise<IntentRecord | undefined> => {
  try {
    const intents = await getIntents();
    const today = getTodayDateString();

    const existingIndex = intents.findIndex((item) => item.date === today);
    const newRecord: IntentRecord = {
      date: today,
      intent: intentText,
      completed: null,
    };

    if (existingIndex > -1) {
      intents[existingIndex] = { ...intents[existingIndex], intent: intentText };
    } else {
      intents.unshift(newRecord);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(intents));
    return newRecord;
  } catch (e) {
    console.error('Error saving intent', e);
  }
};

export const updateIntentStatus = async (date: string, completed: boolean | null): Promise<void> => {
  try {
    const intents = await getIntents();
    const index = intents.findIndex((item) => item.date === date);

    if (index > -1) {
      intents[index] = { ...intents[index], completed };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(intents));
    }
  } catch (e) {
    console.error('Error updating intent status', e);
  }
};
