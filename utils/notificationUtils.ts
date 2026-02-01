import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function checkHasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestPermissions(): Promise<boolean> {
  console.log("Requesting permissions...");

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log("Existing status:", existingStatus);
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log("New status after request:", finalStatus);
  }

  if (finalStatus !== 'granted') {
    console.log("Permission not granted.");
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  console.log("Permission granted!");
  return true;
}

export async function scheduleDailyReminder(hour = 21, minute = 0): Promise<void> {
  // Cancel existing to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 1. NIGHT CHECK-IN REMINDER (User-controlled)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Intent",
      body: "Did you complete today's intent?",
      data: { type: 'check-in' }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hour,
      minute: minute,
    } as Notifications.DailyTriggerInput,
  });

  // 2. MORNING INTENT REMINDER (Universal)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Good Morning",
      body: "What's the ONE thing that matters today?",
      data: { type: 'set-intent' }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    } as Notifications.DailyTriggerInput,
  });
}

export async function scheduleMorningReminderOnly(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const hasMorning = scheduled.some(n => (n.content.data as any)?.type === 'set-intent');

  if (!hasMorning) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Good Morning",
        body: "What's the ONE thing that matters today?",
        data: { type: 'set-intent' }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9, // 9:00 AM
        minute: 0,
      } as Notifications.DailyTriggerInput,
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
