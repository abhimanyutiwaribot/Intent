import React, { useEffect, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import HistoryView from '../components/HistoryView';
import SettingsView from '../components/SettingsView';
import TodayView from '../components/TodayView';
import { Colors } from '../constants/Colors';
import { useAppTheme } from './_layout';

const { width } = Dimensions.get('window');

export default function MainPager() {
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleHistoryCleared = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: width, animated: false });
    }, 0);
  }, []);

  const scrollToSettings = () => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scrollToToday = () => {
    scrollViewRef.current?.scrollTo({ x: width, animated: true });
  };

  const scrollToHistory = () => {
    scrollViewRef.current?.scrollTo({ x: width * 2, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.pager}
        contentOffset={{ x: width, y: 0 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.page}>
          <SettingsView
            onBackPress={scrollToToday}
            onHistoryCleared={handleHistoryCleared}
          />
        </View>
        <View style={styles.page}>
          <TodayView
            onHistoryPress={scrollToHistory}
            onSettingsPress={scrollToSettings}
            refreshKey={refreshKey}
          />
        </View>
        <View style={styles.page}>
          <HistoryView
            onBackPress={scrollToToday}
            refreshKey={refreshKey}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: width,
    flex: 1,
  },
});
