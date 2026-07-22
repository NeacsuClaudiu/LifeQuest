import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { loadData, saveData, clearAll, KEYS } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import { CATEGORIES } from '../data/TaskDatabase';

function AnimatedCard({ title, iconName, delay, children }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Ionicons name={iconName} size={18} color="#FFD700" style={{ marginRight: 8 }} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function StatsScreen() {
  const [character, setCharacter] = useState(null);
  const [tasks, setTasks] = useState([]);

  useFocusEffect(useCallback(async () => {
    let c = await loadData(KEYS.CHARACTER);
    if (!c) {
      c = { ...DEFAULT_CHARACTER };
      await saveData(KEYS.CHARACTER, c);
    }
    const t = await loadData(KEYS.TASKS, []);
    setCharacter(c);
    setTasks(t);
  }, []));

  const resetGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Reset Game', 'All progress will be lost! Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        await clearAll();
        setCharacter(DEFAULT_CHARACTER);
        setTasks([]);
      }},
    ]);
  };

  if (!character) {
    return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  }

  const completedTasks = tasks.filter(t => t.completed);
  const categoryBreakdown = {};
  completedTasks.forEach(t => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
  });

  const achievements = [
    { id: 'first_task', label: 'First Step', icon: 'footsteps-outline', unlocked: character.tasksCompleted >= 1 },
    { id: 'ten_tasks', label: 'Getting Started', icon: 'walk-outline', unlocked: character.tasksCompleted >= 10 },
    { id: 'fifty_tasks', label: 'Dedicated', icon: 'target-outline', unlocked: character.tasksCompleted >= 50 },
    { id: 'hundred_tasks', label: 'Century Club', icon: 'ribbon-outline', unlocked: character.tasksCompleted >= 100 },
    { id: 'streak_3', label: '3-Day Streak', icon: 'flame-outline', unlocked: character.longestStreak >= 3 },
    { id: 'streak_7', label: 'Week Warrior', icon: 'calendar-outline', unlocked: character.longestStreak >= 7 },
    { id: 'streak_30', label: 'Monthly Master', icon: 'trophy-outline', unlocked: character.longestStreak >= 30 },
    { id: 'level_5', label: 'Level 5', icon: 'star-outline', unlocked: character.level >= 5 },
    { id: 'level_10', label: 'Level 10', icon: 'sparkles-outline', unlocked: character.level >= 10 },
    { id: 'level_12', label: 'Max Level', icon: 'diamond-outline', unlocked: character.level >= 12 },
  ];

  const dailyGoal = 3;
  const todayComplete = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    return new Date(t.completedAt).toDateString() === new Date().toDateString();
  }).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
        <Text style={styles.headerSub}>{character.name || 'Hero'}'s Journey</Text>
      </Animated.View>

      <AnimatedCard title="Overview" iconName="bar-chart-outline" delay={200}>
        <View style={styles.overviewRow}>
          {[
            { value: character.totalXpEarned || 0, label: 'Total XP', color: '#FFD700', icon: 'flash-outline' },
            { value: character.tasksCompleted || 0, label: 'Tasks Done', color: '#4CAF50', icon: 'checkmark-done-outline' },
            { value: character.currentStreak || 0, label: 'Streak', color: '#FF5722', icon: 'flame-outline' },
            { value: character.longestStreak || 0, label: 'Best', color: '#A78BFA', icon: 'trophy-outline' },
          ].map((item, i) => (
            <View key={i} style={styles.overviewItem}>
              <Ionicons name={item.icon} size={20} color={item.color} />
              <Text style={[styles.overviewValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.overviewLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </AnimatedCard>

      <AnimatedCard title="Today's Progress" iconName="time-outline" delay={300}>
        <View style={styles.progressRow}>
          {Array.from({ length: dailyGoal }).map((_, i) => (
            <View key={i} style={[styles.progressDot, i < todayComplete && styles.progressDotDone]}>
              {i < todayComplete ? (
                <Ionicons name="checkmark" size={18} color="#fff" />
              ) : (
                <Text style={styles.progressDotText}>{i + 1}</Text>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.progressText}>{todayComplete} / {dailyGoal} daily tasks</Text>
      </AnimatedCard>

      <AnimatedCard title="Achievements" iconName="ribbon-outline" delay={400}>
        <View style={styles.achievementGrid}>
          {achievements.map(a => (
            <View key={a.id} style={[styles.achievement, a.unlocked && styles.achievementUnlocked]}>
              <Ionicons name={a.icon} size={28} color={a.unlocked ? '#FFD700' : '#444'} />
              <Text style={[styles.achievementLabel, a.unlocked && styles.achievementLabelUnlocked]}>
                {a.label}
              </Text>
              {a.unlocked && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={10} color="#0D0D1A" />
                </View>
              )}
            </View>
          ))}
        </View>
      </AnimatedCard>

      {Object.keys(categoryBreakdown).length > 0 && (
        <AnimatedCard title="Category Breakdown" iconName="pie-chart-outline" delay={500}>
          {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
            const catData = CATEGORIES.find(c => c.id === cat);
            const maxCount = Math.max(...Object.values(categoryBreakdown));
            return (
              <View key={cat} style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: catData?.color || '#FFD700' }]} />
                <Text style={styles.categoryName}>{(catData?.label || cat).toUpperCase()}</Text>
                <View style={styles.categoryBarBg}>
                  <View style={[styles.categoryBarFill, {
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: catData?.color || '#FFD700',
                  }]} />
                </View>
                <Text style={[styles.categoryCount, { color: catData?.color || '#FFD700' }]}>{count}</Text>
              </View>
            );
          })}
        </AnimatedCard>
      )}

      <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
        <Ionicons name="trash-outline" size={16} color="#F44336" />
        <Text style={styles.resetText}>Reset Game</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  loadingText: { color: '#FFD700', fontSize: 18 },
  scrollContent: { paddingBottom: 100 },
  header: { padding: 24, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '900' },
  headerSub: { color: '#666', fontSize: 13, marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 },
  card: {
    backgroundColor: '#1A1A2E', marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewItem: { alignItems: 'center', flex: 1 },
  overviewValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  overviewLabel: { color: '#666', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  progressDot: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#2A2A3E',
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 8,
    borderWidth: 2, borderColor: '#333',
  },
  progressDotDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  progressDotText: { color: '#666', fontSize: 16, fontWeight: '700' },
  progressText: { color: '#888', fontSize: 13, textAlign: 'center' },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  achievement: {
    width: '30%', backgroundColor: '#2A2A3E', borderRadius: 14, padding: 12,
    marginRight: '3%', marginBottom: 8, alignItems: 'center', opacity: 0.4,
  },
  achievementUnlocked: { opacity: 1, borderWidth: 1, borderColor: '#FFD700' },
  achievementLabel: { color: '#666', fontSize: 10, textAlign: 'center', marginTop: 6, fontWeight: '600' },
  achievementLabelUnlocked: { color: '#fff' },
  checkBadge: {
    position: 'absolute', top: 4, right: 8,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  categoryName: { color: '#aaa', fontSize: 10, width: 90, fontWeight: '700', letterSpacing: 0.5 },
  categoryBarBg: { flex: 1, height: 8, backgroundColor: '#2A2A3E', borderRadius: 4, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 4 },
  categoryCount: { fontSize: 13, fontWeight: '700', width: 30, textAlign: 'right' },
  resetBtn: {
    marginHorizontal: 16, marginVertical: 20, padding: 16, borderRadius: 14,
    backgroundColor: '#2A1A1A', alignItems: 'center', borderWidth: 1, borderColor: '#F4433633',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  resetText: { color: '#F44336', fontSize: 14, fontWeight: '600' },
});
