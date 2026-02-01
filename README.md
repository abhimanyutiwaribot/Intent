# Intent — Engineering a Singular Focus

**Intent** is a high-performance, minimalist daily ritual app built on **Expo (SDK 54)** and **React Native**. It is engineered to prioritize focus through a singular-task architecture, data persistence, and high-fidelity native animations.

---

## Technical Architecture

### 1. State & Persistence Layer
Utilizes `@react-native-async-storage/async-storage` for local-first data persistence. 
- **Storage Schema**: Discrete storage keys for `AppSettings` and `IntentRecord[]`. 
- **Data Integrity**: Automated date-stamping via `date-fns` style ISO strings to ensure historical accuracy.
- **Midnight Synchronization**: A dual-trigger mechanism using `AppState` listeners and a precise `setTimeout` calculated to 12:00:01 AM, ensuring the UI resets in real-time without requiring a remount.

### 2. Notification Subsystem
Architecture-level separation of concerns for user reminders:
- **Universal Morning Reminder**: Programmatic scheduling at 09:00 AM (local) once system-level permissions are granted, ensuring engagement regardless of app settings.
- **Conditional Evening Ritual**: Triggered by user-controlled state, managed via `expo-notifications` with a `cancelAllScheduledNotificationsAsync` -> `re-schedule` flow to prevent notification leaks or overlaps.
- **Permission Flow**: Implements a "Soft-Ask" pattern. System dialogs are deferred until the user saves their first intent, increasing permission conversion rates.

---

## Development & Deployment

### Dependencies
- **Core**: `expo`, `react-native`, `expo-router`
- **Navigation**: Expo Router v3 (File-based)
- **Icons**: `lucide-react-native`
- **Fonts**: `@expo-google-fonts/inter`

### Launch Commands
- **Install**: `npm install`
- **Development**: `npx expo start`
- **Production Build (EAS)**: `eas build --platform ios` | `eas build --platform android`

---

## Privacy & Security
- **Zero Network I/O**: The app maintains a strict offline-only posture. No analytics, tracking, or external API calls are performed.
- **Sandbox Isolation**: All intent data is stored within the app’s internal sandbox, ensuring no exposure to other applications on the device.

---
