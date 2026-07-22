import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { getLevelInfo, getEvolutionStage, getEvolutionColor } from '../data/CharacterData';
import { loadData, KEYS, getTodayStats } from '../utils/Storage';
import CharacterView from '../components/CharacterView';
import { useTheme } from '../context/ThemeContext';

const DAILY_GOAL = 5;

const PRODUCTIVITY_TIERS = [
  { min: 0, label: 'Let\'s get started!', icon: 'sunny-outline', color: '#9E9E9E' },
  { min: 1, label: 'Good start!', icon: 'partly-sunny-outline', color: '#FF9800' },
  { min: 2, label: 'Building momentum!', icon: 'trending-up-outline', color: '#FFC107' },
  { min: 3, label: 'Productive day!', icon: 'checkmark-circle-outline', color: '#8BC34A' },
  { min: 4, label: 'Almost perfect!', icon: 'star-outline', color: '#4CAF50' },
  { min: 5, label: 'Perfect day!', icon: 'star', color: '#FFD700' },
];

const SUMMARIES = [
  {
    min: 0,
    message: 'Every hero starts somewhere. Tomorrow is a fresh chance to begin your quest!',
    tip: 'Try setting 2-3 small tasks tonight for an easier start tomorrow.',
  },
  {
    min: 1,
    message: 'You took the first step — that takes courage! Keep showing up and the results will follow.',
    tip: 'You\'re building a habit. Aim for 2 tasks tomorrow and build from there!',
  },
  {
    min: 2,
    message: 'Solid effort today! You\'re proving consistency is your superpower.',
    tip: 'You\'re halfway to the daily goal. Add one more tomorrow to push further!',
  },
  {
    min: 3,
    message: 'Great work today! You\'re making real progress on your journey.',
    tip: '3 tasks is strong momentum. You\'re just 2 away from a perfect day!',
  },
  {
    min: 4,
    message: 'So close to perfection! Your discipline is inspiring — keep that energy!',
    tip: 'One more task would have made it a perfect day. Challenge yourself tomorrow!',
  },
  {
    min: 5,
    message: 'A perfect day! You completed all your quests with excellence. You\'re unstoppable!',
    tip: 'This is champion-level consistency. Keep this streak alive!',
  },
];

function StatCard({ label, value, icon, color, suffix, delay, format }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} layout={Layout.springify()} style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}{suffix || ''}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function ProductivityGauge({ score, label, color, icon }) {
  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.gaugeCard}>
      <View style={styles.gaugeHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.gaugeLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.gaugeRing}>
        <View style={[styles.gaugeFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.gaugeScore}>{score}%</Text>
    </Animated.View>
  );
}

export default function DailyReviewScreen({ navigation }) {
  const [character, setCharacter] = useState(null);
  const [todayStats, setTodayStats] = useState({ completed: 0, xpEarned: 0, goldEarned: 0, tasks: [] });
  const { colors } = useTheme();

  useFocusEffect(useCallback(async () => {
    const char = await loadData(KEYS.CHARACTER);
    const stats = await getTodayStats();
    setCharacter(char);
    setTodayStats(stats);
  }, []));

  if (!character) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={[styles.loadingText, { color: colors.accent }]}>Loading...</Text></View>;
  }

  const element = character.element || 'plant';
  const stage = getEvolutionStage(element, character.evolutionStage || 0);
  const stageColor = getEvolutionColor(element);
  const completed = todayStats.completed || 0;
  const xpEarned = todayStats.xpEarned || 0;
  const goldEarned = todayStats.goldEarned || 0;
  const completionPct = Math.min(Math.round((completed / DAILY_GOAL) * 100), 100);
  const productivityTier = PRODUCTIVITY_TIERS.slice().reverse().find(t => completed >= t.min) || PRODUCTIVITY_TIERS[0];
  const summary = SUMMARIES.slice().reverse().find(s => completed >= s.min) || SUMMARIES[0];

  const stats = [
    { label: 'Tasks', value: completed, icon: 'checkmark-circle', color: colors.accent, suffix: `/${DAILY_GOAL}` },
    { label: 'XP Earned', value: xpEarned, icon: 'flash', color: colors.accentSecondary },
    { label: 'Gold Earned', value: goldEarned, icon: 'cash', color: '#FF9800' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      <LinearGradient colors={[stageColor + '22', colors.background]} style={styles.heroGradient}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
          <CharacterView character={character} size="large" />
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>Daily Review</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={200 + i * 60} />
        ))}
      </View>

      <View style={styles.completionSection}>
        <Animated.View entering={FadeInDown.delay(360).springify()} style={[styles.completionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionTitle, { color: colors.textPrimary }]}>Completion</Text>
            <Text style={[styles.completionPct, { color: colors.accent }]}>{completionPct}%</Text>
          </View>
          <View style={[styles.completionBar, { backgroundColor: colors.cardBorder }]}>
            <View style={[styles.completionFill, { width: `${completionPct}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.completionSub, { color: colors.textSecondary }]}>
            {completed} of {DAILY_GOAL} daily tasks completed
          </Text>
        </Animated.View>
      </View>

      <ProductivityGauge
        score={completionPct}
        label={productivityTier.label}
        color={productivityTier.color}
        icon={productivityTier.icon}
      />

      <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.accentSecondary} />
        </View>
        <Text style={[styles.summaryMessage, { color: colors.textPrimary }]}>{summary.message}</Text>
        <View style={[styles.tipRow, { backgroundColor: colors.accent + '15' }]}>
          <Ionicons name="bulb-outline" size={14} color={colors.accent} />
          <Text style={[styles.tipText, { color: colors.accent }]}>{summary.tip}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Tasks')}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.buttonText} />
          <Text style={[styles.actionBtnText, { color: colors.buttonText }]}>Start new tasks</Text>
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
  date: { fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8 },
  statCard: {
    flex: 1, alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 16,
    padding: 16, marginHorizontal: 4, borderWidth: 1, borderColor: '#2A2A3E',
  },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  completionSection: { paddingHorizontal: 16, marginTop: 12 },
  completionCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontSize: 14, fontWeight: '700' },
  completionPct: { fontSize: 20, fontWeight: '900' },
  completionBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 4 },
  completionSub: { fontSize: 11, marginTop: 8 },
  gaugeCard: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#1A1A2E',
    borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3E',
  },
  gaugeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  gaugeLabel: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  gaugeRing: {
    width: '100%', height: 12, backgroundColor: '#2A2A3E', borderRadius: 6, overflow: 'hidden',
  },
  gaugeFill: { height: '100%', borderRadius: 6 },
  gaugeScore: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 8 },
  summaryCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  summaryIconWrap: { marginBottom: 8 },
  summaryMessage: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
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
