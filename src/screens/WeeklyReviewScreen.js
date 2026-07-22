import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { getLevelInfo, getEvolutionStage, getEvolutionColor } from '../data/CharacterData';
import { loadData, KEYS } from '../utils/Storage';
import { DIFFICULTIES, CATEGORIES } from '../data/TaskDatabase';
import CharacterView from '../components/CharacterView';
import { useTheme } from '../context/ThemeContext';
import PressableScale from '../components/PressableScale';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import Skeleton, { SkeletonCard } from '../components/Skeleton';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getWeekId() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function calcWeeklyStats(tasks, character) {
  const { start, end } = getWeekBounds();
  const completed = tasks.filter(t => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d >= start && d <= end;
  });

  const totalTasks = completed.length;
  const xpEarned = completed.reduce((sum, t) => {
    const diff = DIFFICULTIES[t.difficulty];
    return sum + (diff?.xp || 0);
  }, 0);

  const dayCounts = {};
  const dayXp = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toDateString();
    dayCounts[key] = 0;
    dayXp[key] = 0;
  }
  for (const t of completed) {
    const key = new Date(t.completedAt).toDateString();
    if (dayCounts[key] !== undefined) {
      dayCounts[key]++;
      dayXp[key] += DIFFICULTIES[t.difficulty]?.xp || 0;
    }
  }

  let bestDayKey = null;
  let bestDayCount = 0;
  for (const [key, count] of Object.entries(dayCounts)) {
    if (count > bestDayCount) {
      bestDayCount = count;
      bestDayKey = key;
    }
  }
  const bestDay = bestDayKey ? new Date(bestDayKey).toLocaleDateString('en-US', { weekday: 'long' }) : 'N/A';

  const catCounts = {};
  for (const t of completed) {
    const cat = t.category || 'custom';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  let topCat = null;
  let topCatCount = 0;
  for (const [cat, count] of Object.entries(catCounts)) {
    if (count > topCatCount) {
      topCatCount = count;
      topCat = cat;
    }
  }
  const topCategory = CATEGORIES.find(c => c.id === topCat);
  const topCategoryLabel = topCategory?.label || 'Custom';
  const topCategoryIcon = topCategory?.icon || 'star';

  const streak = character?.currentStreak || 0;
  const longestStreak = character?.longestStreak || 0;

  return { totalTasks, xpEarned, bestDay, bestDayCount, topCategory: topCategoryLabel, topCategoryIcon, topCategoryId: topCat, topCategoryCount: topCatCount, streak, longestStreak, dayCounts, dayXp };
}

const FEEDBACKS = [
  {
    min: 0,
    message: 'This week was quiet, and that\'s okay. Rest is part of the journey too. Next week is a fresh start!',
    tip: 'Set 1-2 small daily goals to build momentum for next week.',
  },
  {
    min: 1,
    message: 'You showed up this week — that\'s what matters. Every small step adds up over time.',
    tip: 'Try completing at least one task each day to build a streak.',
  },
  {
    min: 5,
    message: 'Solid effort this week! You\'re building consistency and proving you can get things done.',
    tip: 'Aim for 10 tasks next week — you\'re closer than you think!',
  },
  {
    min: 10,
    message: 'Great week! You\'re making real progress and forming strong habits. Keep it up!',
    tip: 'Try spreading tasks evenly across the week for better balance.',
  },
  {
    min: 15,
    message: 'Impressive week! Your dedication is turning into real results. This is how legends are made.',
    tip: 'Challenge yourself with harder tasks to earn more XP.',
  },
  {
    min: 20,
    message: 'Outstanding week! You\'re operating at an elite level. Your consistency is remarkable!',
    tip: 'You\'re on fire — see if you can keep this pace for another week!',
  },
  {
    min: 25,
    message: 'Extraordinary! You\'ve crushed every goal this week. Nothing can stop you!',
    tip: 'Share your progress — you\'re inspiring others just by showing up!',
  },
];

function StatBadge({ label, value, icon, color, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statBadge}>
      <View style={[styles.badgeIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.badgeValue, { color }]}>{value}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </Animated.View>
  );
}

function DayBar({ day, count, maxCount, xp, delay }) {
  const barHeight = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.dayBarWrap}>
      <Text style={styles.dayBarXp}>{xp > 0 ? `${xp}` : ''}</Text>
      <View style={[styles.dayBarFill, { height: `${Math.max(barHeight, count > 0 ? 10 : 0)}%` }]} />
      <Text style={[styles.dayBarLabel, count > 0 && styles.dayBarLabelActive]}>{day.slice(0, 3)}</Text>
      {count > 0 && <Text style={styles.dayBarCount}>{count}</Text>}
    </Animated.View>
  );
}

export default function WeeklyReviewScreen({ navigation }) {
  const [character, setCharacter] = useState(null);
  const [tasks, setTasks] = useState([]);
  const { colors } = useTheme();

  useFocusEffect(useCallback(async () => {
    const char = await loadData(KEYS.CHARACTER);
    const t = await loadData(KEYS.TASKS, []);
    setCharacter(char);
    setTasks(t);
  }, []));

  const weekStats = useMemo(() => calcWeeklyStats(tasks, character), [tasks, character]);
  const weekId = useMemo(() => getWeekId(), []);

  if (!character) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
        <Skeleton width="50%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="30%" height={14} />
        <View style={{ marginTop: 24, paddingHorizontal: 16, width: '100%' }}>
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      </View>
    );
  }

  const element = character.element || 'plant';
  const stage = getEvolutionStage(element, character.evolutionStage || 0);
  const stageColor = getEvolutionColor(element);

  const feedback = FEEDBACKS.slice().reverse().find(f => weekStats.totalTasks >= f.min) || FEEDBACKS[0];
  const dayKeys = Object.keys(weekStats.dayCounts);
  const maxDayCount = Math.max(...Object.values(weekStats.dayCounts), 1);

  const statsGrid = [
    { label: 'Tasks Done', value: weekStats.totalTasks, icon: 'checkmark-circle', color: colors.accent },
    { label: 'XP Earned', value: weekStats.xpEarned, icon: 'flash', color: colors.accentSecondary },
    { label: 'Best Day', value: weekStats.bestDay, icon: 'trophy', color: '#FF9800' },
    { label: 'Streak', value: `${weekStats.streak}d`, icon: 'flame', color: '#FF5722' },
    { label: 'Longest', value: `${weekStats.longestStreak}d`, icon: 'trending-up', color: '#4CAF50' },
    { label: 'Top Category', value: weekStats.topCategory, icon: weekStats.topCategoryIcon, color: '#A78BFA' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      <LinearGradient colors={[stageColor + '22', colors.background]} style={styles.heroGradient}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
          <CharacterView character={character} size="large" />
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>Weekly Review</Text>
          <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{weekId}</Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        {statsGrid.map((s, i) => (
          <StatBadge key={s.label} {...s} delay={200 + i * 50} />
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(450).springify()} style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Daily Activity</Text>
        <View style={styles.chartRow}>
          {dayKeys.map((key, i) => {
            const d = new Date(key);
            const day = d.toLocaleDateString('en-US', { weekday: 'short' });
            const count = weekStats.dayCounts[key] || 0;
            const xp = weekStats.dayXp[key] || 0;
            return (
              <DayBar key={key} day={day} count={count} maxCount={maxDayCount} xp={xp} delay={500 + i * 40} />
            );
          })}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).springify()} style={[styles.feedbackCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.feedbackIconWrap}>
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.accentSecondary} />
        </View>
        <Text style={[styles.feedbackMessage, { color: colors.textPrimary }]}>{feedback.message}</Text>
        <View style={[styles.tipRow, { backgroundColor: colors.accent + '15' }]}>
          <Ionicons name="bulb-outline" size={14} color={colors.accent} />
          <Text style={[styles.tipText, { color: colors.accent }]}>{feedback.tip}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(650).springify()} style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Tasks')}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.buttonText} />
          <Text style={[styles.actionBtnText, { color: colors.buttonText }]}>Start this week strong</Text>
        </TouchableOpacity>
      </Animated.View>
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
  weekLabel: { fontSize: 13, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  statBadge: {
    width: '31%', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 16,
    padding: 12, marginHorizontal: '1%', marginBottom: 8, borderWidth: 1, borderColor: '#2A2A3E',
  },
  badgeIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  badgeValue: { fontSize: 16, fontWeight: '900' },
  badgeLabel: { color: '#666', fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  chartCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  dayBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  dayBarFill: {
    width: 20, borderRadius: 6, backgroundColor: '#FFD700', minHeight: 0,
  },
  dayBarLabel: { color: '#555', fontSize: 9, marginTop: 4, fontWeight: '600' },
  dayBarLabelActive: { color: '#fff' },
  dayBarCount: { color: '#FFD700', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  dayBarXp: { color: '#666', fontSize: 8, marginBottom: 2 },
  feedbackCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  feedbackIconWrap: { marginBottom: 8 },
  feedbackMessage: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  tipRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, borderRadius: 10,
  },
  tipText: { fontSize: 11, fontWeight: '600', marginLeft: 6, flex: 1 },
  actionRow: { paddingHorizontal: 16, marginTop: 16 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14,
  },
  actionBtnText: { fontSize: 15, fontWeight: '800', marginLeft: 6 },
});
