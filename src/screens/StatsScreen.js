import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { loadData, saveData, clearAll, KEYS, getTodayKey, getWeekKey } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import { CATEGORIES } from '../data/TaskDatabase';
import Heatmap from '../components/Heatmap';

const screenWidth = Dimensions.get('window').width;

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

function StatBadge({ icon, value, label, color, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.statBadge, { borderColor: color + '33' }]}>
      <View style={[styles.statBadgeIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statBadgeValue, { color }]}>{value}</Text>
      <Text style={styles.statBadgeLabel}>{label}</Text>
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
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const tasksThisWeek = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d >= weekStart && d <= now;
  }).length;

  const tasksThisMonth = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d >= monthStart && d <= now;
  }).length;

  const totalXp = character.totalXpEarned || 0;

  const categoryBreakdown = {};
  completedTasks.forEach(t => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
  });

  const xpByCategory = {};
  completedTasks.forEach(t => {
    const xp = t.xp || 0;
    xpByCategory[t.category] = (xpByCategory[t.category] || 0) + xp;
  });

  const daysSinceStart = character.lastActiveDate
    ? Math.floor((now - new Date(character.lastActiveDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const avgPerDay = daysSinceStart > 0 ? (completedCount / daysSinceStart).toFixed(1) : completedCount;

  const dailyGoal = 5;
  const todayComplete = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    return new Date(t.completedAt).toDateString() === now.toDateString();
  }).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="stats-chart" size={28} color="#FFD700" />
        </View>
        <Text style={styles.headerTitle}>Statistics</Text>
        <Text style={styles.headerSub}>{character.name || 'Hero'}'s Journey</Text>
      </Animated.View>

      <AnimatedCard title="Quick Stats" iconName="grid-outline" delay={120}>
        <View style={styles.badgeGrid}>
          <StatBadge icon="checkmark-done" value={completedCount} label="Completed" color="#4CAF50" delay={140} />
          <StatBadge icon="flame" value={character.currentStreak || 0} label="Current Streak" color="#FF5722" delay={160} />
          <StatBadge icon="trophy" value={character.longestStreak || 0} label="Best Streak" color="#A78BFA" delay={180} />
          <StatBadge icon="flash" value={totalXp} label="XP Earned" color="#FFD700" delay={200} />
          <StatBadge icon="checkmark-circle" value={`${completionRate}%`} label="Completion Rate" color="#4ECDC4" delay={220} />
          <StatBadge icon="calendar" value={tasksThisMonth} label="This Month" color="#2196F3" delay={240} />
          <StatBadge icon="trending-up" value={tasksThisWeek} label="This Week" color="#FF9800" delay={260} />
          <StatBadge icon="repeat" value={avgPerDay} label="Avg / Day" color="#E91E63" delay={280} />
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
        <View style={styles.progressMeta}>
          <View style={styles.progressBar}>
            <View style={[styles.progressBarFill, { width: `${(todayComplete / dailyGoal) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{todayComplete} / {dailyGoal} tasks</Text>
        </View>
      </AnimatedCard>

      <AnimatedCard title="XP Summary" iconName="flash-outline" delay={360}>
        <View style={styles.xpRow}>
          <View style={[styles.xpItem, { borderColor: '#FFD70033' }]}>
            <Text style={styles.xpValue}>{totalXp}</Text>
            <Text style={styles.xpLabel}>Total XP</Text>
          </View>
          <View style={[styles.xpItem, { borderColor: '#4CAF5033' }]}>
            <Text style={[styles.xpValue, { color: '#4CAF50' }]}>{Math.round(totalXp / (completedCount || 1))}</Text>
            <Text style={styles.xpLabel}>Avg per Task</Text>
          </View>
          <View style={[styles.xpItem, { borderColor: '#A78BFA33' }]}>
            <Text style={[styles.xpValue, { color: '#A78BFA' }]}>{character.level || 1}</Text>
            <Text style={styles.xpLabel}>Current Level</Text>
          </View>
        </View>
      </AnimatedCard>

      {Object.keys(categoryBreakdown).length > 0 && (
        <AnimatedCard title="Tasks by Category" iconName="pie-chart-outline" delay={420}>
          {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
            const catData = CATEGORIES.find(c => c.id === cat);
            const maxCount = Math.max(...Object.values(categoryBreakdown));
            const xpTotal = xpByCategory[cat] || 0;
            return (
              <View key={cat} style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: catData?.color || '#FFD700' }]} />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{catData?.label || cat}</Text>
                  <Text style={styles.categoryXp}>+{xpTotal} XP</Text>
                </View>
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

      {Object.keys(categoryBreakdown).length > 0 && (
        <AnimatedCard title="Weekly & Monthly" iconName="calendar-outline" delay={480}>
          <View style={styles.periodRow}>
            <View style={[styles.periodCard, { borderColor: '#FF980033' }]}>
              <Ionicons name="calendar" size={22} color="#FF9800" />
              <Text style={styles.periodValue}>{tasksThisWeek}</Text>
              <Text style={styles.periodLabel}>This Week</Text>
              <View style={styles.periodBar}>
                <View style={[styles.periodBarFill, { width: `${Math.min((tasksThisWeek / dailyGoal) * 100, 100)}%`, backgroundColor: '#FF9800' }]} />
              </View>
            </View>
            <View style={[styles.periodCard, { borderColor: '#2196F333' }]}>
              <Ionicons name="calendar" size={22} color="#2196F3" />
              <Text style={styles.periodValue}>{tasksThisMonth}</Text>
              <Text style={styles.periodLabel}>This Month</Text>
              <View style={styles.periodBar}>
                <View style={[styles.periodBarFill, { width: `${Math.min((tasksThisMonth / (dailyGoal * 4)) * 100, 100)}%`, backgroundColor: '#2196F3' }]} />
              </View>
            </View>
          </View>
        </AnimatedCard>
      )}

      <AnimatedCard title="Activity Heatmap" iconName="grid-outline" delay={520}>
        <Heatmap completedTasks={completedTasks} />
      </AnimatedCard>

      <AnimatedCard title="Milestones" iconName="flag-outline" delay={540}>
        <View style={styles.milestoneGrid}>
          {[
            { icon: 'checkmark-done', label: `${completedCount} Tasks`, sub: `of 100 goal`, progress: Math.min(completedCount / 100 * 100, 100), color: '#4CAF50' },
            { icon: 'flame', label: `${character.currentStreak || 0}d Streak`, sub: `of 30d goal`, progress: Math.min((character.currentStreak || 0) / 30 * 100, 100), color: '#FF5722' },
            { icon: 'flash', label: `${totalXp} XP`, sub: `of 5000 goal`, progress: Math.min(totalXp / 5000 * 100, 100), color: '#FFD700' },
            { icon: 'trending-up', label: `Level ${character.level || 1}`, sub: `of 12 goal`, progress: Math.min((character.level || 1) / 12 * 100, 100), color: '#A78BFA' },
          ].map((m, i) => (
            <View key={i} style={styles.milestoneRow}>
              <View style={[styles.milestoneIcon, { backgroundColor: m.color + '22' }]}>
                <Ionicons name={m.icon} size={16} color={m.color} />
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
                <Text style={styles.milestoneSub}>{m.sub}</Text>
              </View>
              <View style={styles.milestoneBar}>
                <View style={[styles.milestoneBarFill, { width: `${m.progress}%`, backgroundColor: m.color }]} />
              </View>
            </View>
          ))}
        </View>
      </AnimatedCard>

      {character.achievements && character.achievements.length > 0 && (
        <AnimatedCard title="Unlocked Achievements" iconName="ribbon-outline" delay={600}>
          <View style={styles.achGrid}>
            {(character.achievements || []).map((id, i) => {
              const labels = {
                first_task: 'First Step', ten_tasks: '10 Tasks', twentyfive_tasks: '25 Tasks',
                fifty_tasks: '50 Tasks', hundred_tasks: '100 Tasks',
                streak_3: '3-Day', streak_7: '7-Day', streak_14: '14-Day', streak_30: '30-Day',
                level_3: 'Level 3', level_5: 'Level 5', level_8: 'Level 8', level_10: 'Level 10', level_12: 'Level 12',
                evo_3: 'Evolution 3', evo_7: 'Evolution 7',
                xp_500: '500 XP', xp_2000: '2000 XP', xp_5000: '5000 XP',
              };
              return (
                <View key={id} style={styles.achChip}>
                  <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                  <Text style={styles.achChipText}>{labels[id] || id}</Text>
                </View>
              );
            })}
          </View>
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
  headerIconWrap: { marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '900' },
  headerSub: { color: '#666', fontSize: 13, marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 },
  card: {
    backgroundColor: '#1A1A2E', marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBadge: {
    width: '23%', backgroundColor: '#2A2A3E', borderRadius: 14, padding: 10,
    alignItems: 'center', marginBottom: 8, borderWidth: 1,
  },
  statBadgeIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statBadgeValue: { fontSize: 18, fontWeight: '900' },
  statBadgeLabel: { color: '#666', fontSize: 8, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  progressDot: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2A3E',
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 6,
    borderWidth: 2, borderColor: '#333',
  },
  progressDotDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  progressDotText: { color: '#666', fontSize: 14, fontWeight: '700' },
  progressMeta: { alignItems: 'center' },
  progressBar: { height: 6, backgroundColor: '#2A2A3E', borderRadius: 3, overflow: 'hidden', width: '80%', marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { color: '#888', fontSize: 13 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpItem: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 1, marginHorizontal: 3, backgroundColor: '#2A2A3E',
  },
  xpValue: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
  xpLabel: { color: '#666', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  categoryInfo: { width: 80, marginRight: 8 },
  categoryName: { color: '#aaa', fontSize: 10, fontWeight: '700' },
  categoryXp: { color: '#555', fontSize: 8, marginTop: 1 },
  categoryBarBg: { flex: 1, height: 8, backgroundColor: '#2A2A3E', borderRadius: 4, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 4 },
  categoryCount: { fontSize: 13, fontWeight: '700', width: 30, textAlign: 'right' },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  periodCard: {
    flex: 1, backgroundColor: '#2A2A3E', borderRadius: 14, padding: 14,
    alignItems: 'center', marginHorizontal: 4, borderWidth: 1,
  },
  periodValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 },
  periodLabel: { color: '#666', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  periodBar: { height: 4, backgroundColor: '#1A1A2E', borderRadius: 2, overflow: 'hidden', width: '100%', marginTop: 8 },
  periodBarFill: { height: '100%', borderRadius: 2 },
  milestoneGrid: {},
  milestoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  milestoneIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  milestoneInfo: { width: 80 },
  milestoneLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  milestoneSub: { color: '#555', fontSize: 9, marginTop: 1 },
  milestoneBar: { flex: 1, height: 6, backgroundColor: '#2A2A3E', borderRadius: 3, overflow: 'hidden' },
  milestoneBarFill: { height: '100%', borderRadius: 3 },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  achChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A3E',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6,
  },
  achChipText: { color: '#aaa', fontSize: 10, fontWeight: '600', marginLeft: 4 },
  resetBtn: {
    marginHorizontal: 16, marginVertical: 20, padding: 16, borderRadius: 14,
    backgroundColor: '#2A1A1A', alignItems: 'center', borderWidth: 1, borderColor: '#F4433633',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  resetText: { color: '#F44336', fontSize: 14, fontWeight: '600' },
});
