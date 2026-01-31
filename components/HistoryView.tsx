import { useFocusEffect } from 'expo-router';
import { Check, ChevronLeft, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../app/_layout';
import { Colors } from '../constants/Colors';
import { getIntents, IntentRecord } from '../storage/intentStorage';
import { formatDate } from '../utils/dateUtils';
import Skeleton from './Skeleton';

interface HistoryViewProps {
  onBackPress: () => void;
  refreshKey?: number;
}

export default function HistoryView({ onBackPress, refreshKey }: HistoryViewProps) {
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;

  const [history, setHistory] = useState<IntentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    setIsLoading(true);
    const dataPromise = getIntents();
    const delayPromise = new Promise(resolve => setTimeout(resolve, 400));
    const [data] = await Promise.all([dataPromise, delayPromise]);

    setHistory(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [refreshKey]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const renderItem = ({ item }: { item: IntentRecord }) => (
    <View style={[styles.historyItem, { borderBottomColor: theme.border }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemDate, { color: theme.secondaryText }]}>{formatDate(item.date)}</Text>
        {item.completed !== null && (
          <View style={[
            styles.badge,
            { backgroundColor: item.completed ? theme.success : theme.error, opacity: 0.9 }
          ] as ViewStyle[]}>
            {item.completed ? <Check size={12} color="#FFF" strokeWidth={3} /> : <X size={12} color="#FFF" strokeWidth={3} />}
          </View>
        )}
      </View>
      <Text style={[styles.itemIntent, { color: theme.text }]}>{item.intent}</Text>
    </View>
  );

  if (isLoading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Skeleton width={120} height={28} borderRadius={4} />
      </View>
      <View style={styles.listContent}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.historyItem, { borderBottomColor: theme.border }]}>
            <View style={styles.itemHeader}>
              <Skeleton width={100} height={14} borderRadius={4} />
              <Skeleton width={22} height={22} borderRadius={11} />
            </View>
            <Skeleton width="80%" height={24} borderRadius={4} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton} hitSlop={20}>
          <ChevronLeft color={theme.text} size={28} strokeWidth={2.5} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>History</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No history yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  historyItem: {
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemIntent: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 120,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  }
});
