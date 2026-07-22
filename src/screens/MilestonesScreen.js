import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { getLevelInfo, getEvolutionStage, getEvolutionColor } from '../data/CharacterData';
import { loadData, KEYS } from '../utils/Storage';
import CharacterView from '../components/CharacterView';
import { useTheme } from '../context/ThemeContext';
import PressableScale from '../components/PressableScale';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import Skeleton, { SkeletonCard } from '../components/Skeleton';

const MILESTONES = [
  { id: 'xp_100', category: 'xp', label: '100 XP', target: 100, icon: 'flash', color: '#FFD700' },
  { id: 'xp_500', category: 'xp', label: '500 XP', target: 500, icon: 'flash', color: '#FFD700' },
  { id: 'xp_1000', category: 'xp', label: '1,000 XP', target: 1000, icon: 'flash', color: '#FFD700' },
  { id: 'xp_5000', category: 'xp', label: '5,000 XP', target: 5000, icon: 'flash', color: '#FFD700' },
  { id: 'xp_10000', category: 'xp', label: '10,000 XP', target: 10000, icon: 'flash', color: '#FFD700' },
  { id: 'xp_50000', category: 'xp', label: '50,000 XP', target: 50000, icon: 'flash', color: '#FFD700' },
  { id: 'xp_100000', category: 'xp', label: '100,000 XP', target: 100000, icon: 'flash', color: '#FFD700' },
  { id: 'tasks_10', category: 'tasks', label: '10 Tasks', target: 10, icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'tasks_50', category: 'tasks', label: '50 Tasks', target: 50, icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'tasks_100', category: 'tasks', label: '100 Tasks', target: 100, icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'tasks_500', category: 'tasks', label: '500 Tasks', target: 500, icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'tasks_1000', category: 'tasks', label: '1,000 Tasks', target: 1000, icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'tasks_5000', category: 'tasks', label: '5,000 Tasks', target: 5000, icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'streak_7', category: 'streak', label: '7-Day Streak', target: 7, icon: 'flame', color: '#FF5722' },
  { id: 'streak_14', category: 'streak', label: '14-Day Streak', target: 14, icon: 'flame', color: '#FF5722' },
  { id: 'streak_30', category: 'streak', label: '30-Day Streak', target: 30, icon: 'flame', color: '#FF5722' },
  { id: 'streak_60', category: 'streak', label: '60-Day Streak', target: 60, icon: 'flame', color: '#FF5722' },
  { id: 'streak_100', category: 'streak', label: '100-Day Streak', target: 100, icon: 'flame', color: '#FF5722' },
  { id: 'streak_365', category: 'streak', label: '365-Day Streak', target: 365, icon: 'flame', color: '#FF5722' },
  { id: 'level_5', category: 'level', label: 'Level 5', target: 5, icon: 'star', color: '#A78BFA' },
  { id: 'level_10', category: 'level', label: 'Level 10', target: 10, icon: 'star', color: '#A78BFA' },
  { id: 'level_25', category: 'level', label: 'Level 25', target: 25, icon: 'star', color: '#A78BFA' },
  { id: 'level_50', category: 'level', label: 'Level 50', target: 50, icon: 'star', color: '#A78BFA' },
  { id: 'level_100', category: 'level', label: 'Level 100', target: 100, icon: 'star', color: '#A78BFA' },
];

const CATEGORIES = [
  { id: 'xp', label: 'XP', icon: 'flash', color: '#FFD700' },
  { id: 'tasks', label: 'Tasks', icon: 'checkmark-circle', color: '#4CAF50' },
  { id: 'streak', label: 'Streak', icon: 'flame', color: '#FF5722' },
  { id: 'level', label: 'Level', icon: 'star', color: '#A78BFA' },
];

function getCurrentValue(character, category) {
  switch (category) {
    case 'xp': return character?.totalXpEarned || 0;
    case 'tasks': return character?.tasksCompleted || 0;
    case 'streak': return character?.longestStreak || 0;
    case 'level': return character?.level || 1;
    default: return 0;
  }
}

function MilestoneCard({ milestone, current, index }) {
  const progress = Math.min((current / milestone.target) * 100, 100);
  const isComplete = current >= milestone.target;

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 40).springify()}
      layout={Layout.springify()}
      style={styles.card}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrap, { backgroundColor: milestone.color + '22' }]}>
          <Ionicons name={isComplete ? 'checkmark-circle' : milestone.icon} size={22} color={isComplete ? '#4CAF50' : milestone.color} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{milestone.label}</Text>
        <AnimatedProgressBar progress={progress} color={isComplete ? '#4CAF50' : milestone.color} height={6} backgroundColor={colors.cardBorder} />
        <Text style={styles.cardMeta}>
          {isComplete ? 'Completed!' : `${current.toLocaleString()} / ${milestone.target.toLocaleString()}`}
        </Text>
      </View>
      {isComplete && (
        <View style={[styles.completeBadge, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      )}
    </Animated.View>
  );
}

export default function MilestonesScreen() {
  const [character, setCharacter] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const { colors } = useTheme();

  useFocusEffect(useCallback(async () => {
    const char = await loadData(KEYS.CHARACTER);
    setCharacter(char);
  }, []));

  if (!character) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
        <Skeleton width="50%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="30%" height={14} />
        <View style={{ marginTop: 24, paddingHorizontal: 16, width: '100%' }}>
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
        </View>
      </View>
    );
  }

  const element = character.element || 'plant';
  const stage = getEvolutionStage(element, character.evolutionStage || 0);
  const stageColor = getEvolutionColor(element);

  const filteredMilestones = activeCategory === 'all'
    ? MILESTONES
    : MILESTONES.filter(m => m.category === activeCategory);

  const completedCount = MILESTONES.filter(m => getCurrentValue(character, m.category) >= m.target).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      <LinearGradient colors={[stageColor + '22', colors.background]} style={styles.heroGradient}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
          <CharacterView character={character} size="large" />
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>Milestones</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {completedCount} of {MILESTONES.length} milestones reached
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.filterInner}>
          {[{ id: 'all', label: 'All', icon: 'apps', color: colors.accent }, ...CATEGORIES].map(cat => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(150).springify()}>
              <PressableScale
                onPress={() => setActiveCategory(cat.id)}
              >
                <View
                  style={[
                    styles.filterChip,
                    activeCategory === cat.id && { backgroundColor: cat.color + '22', borderColor: cat.color },
                    { backgroundColor: activeCategory === cat.id ? cat.color + '22' : colors.cardBg, borderColor: activeCategory === cat.id ? cat.color : colors.cardBorder },
                  ]}
                >
                  <Ionicons name={cat.icon} size={14} color={activeCategory === cat.id ? cat.color : colors.textMuted} />
                  <Text style={[styles.filterText, { color: activeCategory === cat.id ? cat.color : colors.textSecondary }]}>{cat.label}</Text>
                </View>
              </PressableScale>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      <View style={styles.list}>
        {filteredMilestones.map((milestone, i) => {
          const current = getCurrentValue(character, milestone.category);
          return (
            <MilestoneCard key={milestone.id} milestone={milestone} current={current} index={i} />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },
  heroGradient: { paddingTop: 30, paddingBottom: 20 },
  hero: { alignItems: 'center' },
  greeting: { fontSize: 26, fontWeight: '900', marginTop: 12 },
  subtitle: { fontSize: 13, marginTop: 4 },
  filterRow: { marginTop: 8, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16 },
  filterInner: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  filterText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  list: { paddingHorizontal: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E',
    borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  cardLeft: { marginRight: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardBar: {
    height: 6, backgroundColor: '#2A2A3E', borderRadius: 3, overflow: 'hidden', marginTop: 8,
  },
  cardBarFill: { height: '100%', borderRadius: 3 },
  cardMeta: { color: '#666', fontSize: 11, marginTop: 4 },
  completeBadge: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
});
