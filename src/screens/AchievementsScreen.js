import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { ACHIEVEMENTS, getLevelInfo, checkAchievements, getUnlockedAchievements } from '../data/CharacterData';
import { loadData, saveData, KEYS, logAchievement, getRecentAchievements } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import ConfettiOverlay from '../components/ConfettiOverlay';
import { useTheme } from '../context/ThemeContext';

function AchievementCard({ achievement, progress, progressLabel, unlocked, color, delay }) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      layout={Layout.springify()}
      style={[styles.achCard, unlocked && { borderColor: color }, { backgroundColor: colors.cardBg, borderColor: unlocked ? color : colors.cardBorder }]}
    >
      <View style={[styles.achIconWrap, { backgroundColor: unlocked ? color + '22' : colors.cardBorder }]}>
        <Ionicons name={achievement.icon} size={24} color={unlocked ? color : colors.textMuted} />
      </View>
      <View style={styles.achInfo}>
        <Text style={[styles.achName, unlocked && { color: colors.textPrimary }]}>{achievement.name}</Text>
        <Text style={[styles.achDesc, { color: colors.textMuted }]}>{achievement.description}</Text>
        {unlocked ? (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={color} />
            <Text style={[styles.unlockedText, { color }]}>Unlocked</Text>
          </View>
        ) : (
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: color + '88' }]} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>{progressLabel}</Text>
          </View>
        )}
      </View>
      {unlocked && (
        <View style={[styles.checkCircle, { backgroundColor: color + '22' }]}>
          <Ionicons name="checkmark" size={18} color={color} />
        </View>
      )}
    </Animated.View>
  );
}

function getAchievementProgress(achievement, character, tasks) {
  const tasksCompleted = character.tasksCompleted || 0;
  const streak = character.longestStreak || 0;
  const level = character.level || 1;
  const xp = character.totalXpEarned || 0;
  const evo = character.evolutionStage || 0;

  switch (achievement.id) {
    case 'first_task':
      return { progress: Math.min(tasksCompleted, 1) * 100, label: `${tasksCompleted}/1` };
    case 'ten_tasks':
      return { progress: (tasksCompleted / 10) * 100, label: `${tasksCompleted}/10` };
    case 'twentyfive_tasks':
      return { progress: (tasksCompleted / 25) * 100, label: `${tasksCompleted}/25` };
    case 'fifty_tasks':
      return { progress: (tasksCompleted / 50) * 100, label: `${tasksCompleted}/50` };
    case 'hundred_tasks':
      return { progress: (tasksCompleted / 100) * 100, label: `${tasksCompleted}/100` };
    case 'streak_3':
      return { progress: (streak / 3) * 100, label: `${streak}/3` };
    case 'streak_7':
      return { progress: (streak / 7) * 100, label: `${streak}/7` };
    case 'streak_14':
      return { progress: (streak / 14) * 100, label: `${streak}/14` };
    case 'streak_30':
      return { progress: (streak / 30) * 100, label: `${streak}/30` };
    case 'level_3':
      return { progress: Math.min(level, 3) / 3 * 100, label: `${level}/3` };
    case 'level_5':
      return { progress: Math.min(level, 5) / 5 * 100, label: `${level}/5` };
    case 'level_8':
      return { progress: Math.min(level, 8) / 8 * 100, label: `${level}/8` };
    case 'level_10':
      return { progress: Math.min(level, 10) / 10 * 100, label: `${level}/10` };
    case 'level_12':
      return { progress: Math.min(level, 12) / 12 * 100, label: `${level}/12` };
    case 'evo_3':
      return { progress: (evo / 3) * 100, label: `${evo}/3` };
    case 'evo_7':
      return { progress: (evo / 7) * 100, label: `${evo}/7` };
    case 'xp_500':
      return { progress: Math.min(xp, 500) / 5, label: `${xp}/500` };
    case 'xp_2000':
      return { progress: Math.min(xp, 2000) / 20, label: `${xp}/2000` };
    case 'xp_5000':
      return { progress: Math.min(xp, 5000) / 50, label: `${xp}/5000` };
    default:
      return { progress: 0, label: '0%' };
  }
}

export default function AchievementsScreen() {
  const [character, setCharacter] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [confetti, setConfetti] = useState(false);
  const { colors } = useTheme();

  useFocusEffect(useCallback(async () => {
    const c = await loadData(KEYS.CHARACTER);
    const t = await loadData(KEYS.TASKS, []);
    if (c) {
      const newlyUnlocked = checkAchievements(c);
      if (newlyUnlocked.length > 0) {
        const updated = { ...c, achievements: [...(c.achievements || [])] };
        for (const a of newlyUnlocked) {
          if (!updated.achievements.includes(a.id)) {
            updated.achievements.push(a.id);
            await logAchievement(a);
          }
        }
        await saveData(KEYS.CHARACTER, updated);
        setCharacter(updated);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3000);
      } else {
        setCharacter(c);
      }
    }
    setTasks(t);
  }, []));

  if (!character) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.accent }]}>Loading achievements...</Text>
      </View>
    );
  }

  const unlockedIds = character.achievements || [];
  const filterOptions = [
    { key: 'all', label: 'All', icon: 'grid' },
    { key: 'unlocked', label: 'Unlocked', icon: 'checkmark-circle' },
    { key: 'locked', label: 'Locked', icon: 'lock-closed' },
  ];

  const filteredAchievements = ACHIEVEMENTS.filter(a => {
    if (activeFilter === 'unlocked') return unlockedIds.includes(a.id);
    if (activeFilter === 'locked') return !unlockedIds.includes(a.id);
    return true;
  });

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const percentComplete = (unlockedCount / totalCount) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <Ionicons name="trophy" size={28} color={colors.accent} />
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Achievements</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.overviewCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewValue, { color: colors.accent }]}>{unlockedCount}</Text>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Unlocked</Text>
            </View>
            <View style={[styles.overviewDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewValue, { color: colors.accent }]}>{totalCount}</Text>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.overviewDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewValue, { color: colors.accent }]}>{Math.round(percentComplete)}%</Text>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Complete</Text>
            </View>
          </View>
          <View style={[styles.overviewBar, { backgroundColor: colors.cardBorder }]}>
            <View style={[styles.overviewBarFill, { width: `${percentComplete}%`, backgroundColor: colors.accent }]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.filterRow}>
          {filterOptions.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive, { backgroundColor: activeFilter === f.key ? colors.accent : colors.cardBg, borderColor: activeFilter === f.key ? colors.accent : colors.cardBorder }]}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f.key); }}
            >
              <Ionicons name={f.icon} size={14} color={activeFilter === f.key ? colors.background : colors.textSecondary} />
              <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive, { color: activeFilter === f.key ? colors.background : colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {filteredAchievements.map((achievement, i) => {
          const unlocked = unlockedIds.includes(achievement.id);
          const color = unlocked ? colors.accent : colors.textSecondary;
          const progressInfo = unlocked
            ? { progress: 100, label: 'Done!' }
            : getAchievementProgress(achievement, character, tasks);
          return (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              progress={progressInfo.progress}
              progressLabel={progressInfo.label}
              unlocked={unlocked}
              color={color}
              delay={200 + i * 40}
            />
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
      <ConfettiOverlay visible={confetti} onComplete={() => setConfetti(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  loadingText: { color: '#FFD700', fontSize: 18, fontWeight: '600' },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { color: '#FFD700', fontSize: 26, fontWeight: '900', marginLeft: 10 },
  overviewCard: {
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#2A2A3E', marginBottom: 12,
  },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  overviewStat: { alignItems: 'center' },
  overviewValue: { color: '#FFD700', fontSize: 24, fontWeight: '900' },
  overviewLabel: { color: '#666', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  overviewDivider: { width: 1, backgroundColor: '#2A2A3E' },
  overviewBar: { height: 6, backgroundColor: '#2A2A3E', borderRadius: 3, overflow: 'hidden' },
  overviewBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#1A1A2E', marginRight: 8,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  filterChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  filterText: { color: '#666', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  filterTextActive: { color: '#0D0D1A' },
  achCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  achIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  achInfo: { flex: 1 },
  achName: { color: '#888', fontSize: 14, fontWeight: '700' },
  achDesc: { color: '#555', fontSize: 11, marginTop: 2 },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  unlockedText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  progressBar: {
    flex: 1, height: 4, backgroundColor: '#2A2A3E', borderRadius: 2,
    overflow: 'hidden', marginRight: 8,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { color: '#555', fontSize: 10, fontWeight: '600', minWidth: 40, textAlign: 'right' },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
});
