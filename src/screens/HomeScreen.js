import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { DIFFICULTIES } from '../data/TaskDatabase';
import { getLevelInfo, getCharacterStage } from '../data/CharacterData';
import { loadData, saveData, KEYS } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import CharacterView from '../components/CharacterView';
import XPBar from '../components/XPBar';
import TaskCard from '../components/TaskCard';

function StatCard({ label, value, iconName, color, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.statCard, { borderColor: color + '44' }]}>
      <Ionicons name={iconName} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [character, setCharacter] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDataAsync = useCallback(async () => {
    let char = await loadData(KEYS.CHARACTER);
    if (!char) {
      char = { ...DEFAULT_CHARACTER };
      await saveData(KEYS.CHARACTER, char);
    }
    const t = await loadData(KEYS.TASKS, []);
    setCharacter(char);
    setTasks(t.filter(task => !task.completed).slice(0, 5));
  }, []);

  useFocusEffect(useCallback(() => { loadDataAsync(); }, [loadDataAsync]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDataAsync();
    setRefreshing(false);
  };

  if (!character) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Start your journey...</Text>
      </View>
    );
  }

  const levelInfo = getLevelInfo(character.level);
  const stage = getCharacterStage(character.level);
  const totalTasks = character.tasksCompleted || 0;
  const streak = character.currentStreak || 0;

  const statsCards = [
    { label: 'Level', value: character.level, iconName: 'star', color: '#FFD700' },
    { label: 'Tasks Done', value: totalTasks, iconName: 'checkmark-done-circle', color: '#4CAF50' },
    { label: 'Streak', value: `${streak}d`, iconName: 'flame', color: '#FF5722' },
    { label: 'Total XP', value: character.totalXpEarned || 0, iconName: 'flash', color: '#A78BFA' },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={[stage.color + '22', '#0D0D1A00']}
              style={styles.heroGradient}
            >
              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
                <CharacterView character={character} size="large" />
                <View style={styles.heroInfo}>
                  <Text style={styles.stageName}>{stage.label} Stage</Text>
                  <Text style={styles.heroTitle}>{character.name || 'Hero'}</Text>
                  <View style={styles.titlePill}>
                    <Text style={styles.titlePillText}>{levelInfo.title}</Text>
                  </View>
                </View>
              </Animated.View>
            </LinearGradient>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <XPBar
                current={character.totalXpEarned || 0}
                required={levelInfo.currentXpRequired}
                nextRequired={levelInfo.nextXpRequired}
                level={character.level}
                title={levelInfo.title}
              />
            </Animated.View>

            <View style={styles.statsRow}>
              {statsCards.map((stat, i) => (
                <StatCard key={i} {...stat} delay={300 + i * 80} />
              ))}
            </View>

            <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Today's Tasks</Text>
                <Text style={styles.sectionSub}>{tasks.length} active</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('Tasks')}
              >
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        }
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(700 + index * 60).springify()}>
            <TaskCard task={item} compact onComplete={() => {}} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="flag-outline" size={36} color="#FFD700" />
            </View>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap Tasks → and add your first quest!</Text>
          </Animated.View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
        contentContainerStyle={styles.scrollContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  loadingText: { color: '#FFD700', fontSize: 20, fontWeight: '600' },
  scrollContent: { paddingBottom: 100 },
  heroGradient: { paddingTop: 40, paddingBottom: 20 },
  hero: { alignItems: 'center' },
  heroInfo: { alignItems: 'center', marginTop: 12 },
  stageName: { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },
  titlePill: { backgroundColor: '#FFD70022', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3, marginTop: 6 },
  titlePillText: { color: '#FFD700', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, marginVertical: 12 },
  statCard: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 10, marginHorizontal: 3,
    alignItems: 'center', borderWidth: 1,
  },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  statLabel: { color: '#666', fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 16, marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sectionSub: { color: '#666', fontSize: 12, marginTop: 2 },
  seeAllBtn: { backgroundColor: '#FFD70015', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  seeAllText: { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A1A2E',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: '#2A2A3E',
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
});
