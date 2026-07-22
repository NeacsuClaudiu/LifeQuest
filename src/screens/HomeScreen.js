import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import PressableScale from '../components/PressableScale';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import FloatingReward from '../components/FloatingReward';
import Skeleton, { SkeletonCard } from '../components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { DIFFICULTIES } from '../data/TaskDatabase';
import { getLevelInfo, getLevel, getEvolutionStage, getEvolutionColor, processDayCheck, getXpPenalty, getElement, ELEMENTS, checkAchievements, getUnlockedAchievements, ACHIEVEMENTS } from '../data/CharacterData';
import { loadData, saveData, KEYS, getTodayStats, getWeeklyStats, recordTaskCompleted, recordGoldEarned, logAchievement } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import { getQuoteOfDay } from '../data/Quotes';
import CharacterView from '../components/CharacterView';
import XPBar from '../components/XPBar';
import TaskCard from '../components/TaskCard';
import DailyReward from '../components/DailyReward';
import { useTheme } from '../context/ThemeContext';

function StatCard({ label, value, iconName, color, delay, colors }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.statCard, { borderColor: color + '44', backgroundColor: colors.cardBg }]}>
      <Ionicons name={iconName} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Animated.View>
  );
}

function MiniCard({ icon, iconColor, title, subtitle, progress, progressColor, delay, colors }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.miniCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.miniHeader}>
        <View style={[styles.miniIconWrap, { backgroundColor: colors.cardBorder }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[styles.miniTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {progress !== undefined && (
        <AnimatedProgressBar progress={Math.min(progress, 100)} color={progressColor} height={6} backgroundColor={colors.cardBorder} />
      )}
      {subtitle && <Text style={[styles.miniSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </Animated.View>
  );
}

function AchievementRow({ icon, iconColor, title, subtitle, delay, isNew, colors }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.achievementRow, { borderBottomColor: colors.cardBorder }]}>
      <View style={[styles.achievementIcon, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.achievementSub, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      {isNew && <View style={[styles.newBadge, { backgroundColor: colors.accent + '22' }]}><Text style={[styles.newBadgeText, { color: colors.accent }]}>NEW</Text></View>}
    </Animated.View>
  );
}

const DAILY_GOAL = 5;

export default function HomeScreen({ navigation }) {
  const [character, setCharacter] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({ completed: 0, xpEarned: 0, tasks: [] });
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, xpEarned: 0 });
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [newAchievements, setNewAchievements] = useState([]);
  const { colors } = useTheme();
  const quote = getQuoteOfDay();

  const loadDataAsync = useCallback(async () => {
    let char = await loadData(KEYS.CHARACTER);
    if (!char) {
      char = { ...DEFAULT_CHARACTER };
      await saveData(KEYS.CHARACTER, char);
    }
    char = processDayCheck(char);

    const newlyUnlocked = checkAchievements(char);
    if (newlyUnlocked.length > 0) {
      const updatedAchievements = [...(char.achievements || [])];
      for (const a of newlyUnlocked) {
        if (!updatedAchievements.includes(a.id)) {
          updatedAchievements.push(a.id);
          await logAchievement(a);
        }
      }
      char.achievements = updatedAchievements;
    }

    await saveData(KEYS.CHARACTER, char);
    const t = await loadData(KEYS.TASKS, []);
    const today = await getTodayStats();
    const week = await getWeeklyStats();
    const recent = await loadData('@lifequest_achievements_log', []);

    setCharacter(char);
    setAllTasks(t);
    setTasks(t.filter(task => !task.completed).slice(0, 5));
    setTodayStats(today);
    setWeeklyStats(week);
    setNewAchievements(newlyUnlocked);
    setRecentAchievements(recent.slice(-5).reverse());

    if (newlyUnlocked.length > 0) {
      setTimeout(() => setNewAchievements([]), 5000);
    }
  }, []);

  const handleClaimReward = useCallback(async (rewards) => {
    const updated = { ...character };
    updated.totalXpEarned = (updated.totalXpEarned || 0) + rewards.xp;
    updated.gold = (updated.gold || 0) + rewards.gold;
    updated.lastDailyReward = new Date().toISOString();
    updated.dailyRewardStreak = (updated.dailyRewardStreak || 0) + 1;
    const newLevel = getLevel(updated.totalXpEarned);
    const levelInfo = getLevelInfo(newLevel);
    if (newLevel > updated.level) updated.level = newLevel;
    await saveData(KEYS.CHARACTER, updated);
    await recordGoldEarned(rewards.gold);
    setCharacter(updated);
  }, [character]);

  useFocusEffect(useCallback(() => { loadDataAsync(); }, [loadDataAsync]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDataAsync();
    setRefreshing(false);
  };

  if (!character) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
        <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={14} />
        <View style={{ marginTop: 30, paddingHorizontal: 16, width: '100%' }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={80} />
          <SkeletonCard height={60} />
        </View>
      </View>
    );
  }

  const levelInfo = getLevelInfo(character.level);
  const element = character.element || 'plant';
  const stage = getEvolutionStage(element, character.evolutionStage || 0);
  const stageColor = getEvolutionColor(element);
  const totalTasks = character.tasksCompleted || 0;
  const streak = character.currentStreak || 0;
  const penalty = getXpPenalty(character);
  const daysSinceActive = character.daysSkipped || 0;
  const maxStages = 8;
  const progressPercent = ((character.evolutionStage || 0) / maxStages) * 100;

  const dailyProgress = Math.min((todayStats.completed / DAILY_GOAL) * 100, 100);
  const weeklyPercent = weeklyStats.completed > 0 ? Math.min((weeklyStats.completed / (DAILY_GOAL * 7)) * 100, 100) : 0;

  const xpForNext = levelInfo.nextXpRequired - (character.totalXpEarned || 0);
  const xpPercent = Math.min(((character.totalXpEarned - levelInfo.currentXpRequired) / (levelInfo.nextXpRequired - levelInfo.currentXpRequired)) * 100, 100);

  const topPriorityTask = tasks.length > 0
    ? tasks.reduce((best, t) => {
        const bestDiff = DIFFICULTIES[best.difficulty]?.xp || 0;
        const curDiff = DIFFICULTIES[t.difficulty]?.xp || 0;
        return curDiff > bestDiff ? t : best;
      }, tasks[0])
    : null;

  const statsCards = [
    { label: 'Level', value: character.level, iconName: 'star', color: '#FFD700' },
    { label: 'Tasks Done', value: totalTasks, iconName: 'checkmark-done-circle', color: colors.accent },
    { label: 'Streak', value: `${streak}d`, iconName: 'flame', color: '#FF5722' },
    { label: 'XP', value: character.totalXpEarned || 0, iconName: 'flash', color: colors.accentSecondary },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={[stageColor + '22', colors.background + '00']}
              style={styles.heroGradient}
            >
              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
                <CharacterView character={character} size="large" />
                <View style={styles.heroInfo}>
                  <Text style={[styles.stageName, { color: stageColor }]}>
                    {stage.name} ({character.evolutionStage || 0}/7)
                  </Text>
                  <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{character.name || 'Hero'}</Text>
                  <View style={[styles.titlePill, { backgroundColor: colors.accent + '22' }]}>
                    <Text style={[styles.titlePillText, { color: colors.accent }]}>{levelInfo.title}</Text>
                  </View>
                  <View style={styles.goldBadge}>
                    <Ionicons name="cash" size={12} color="#FF9800" />
                    <Text style={styles.goldText}>{character.gold || 0}</Text>
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

            <Animated.View entering={FadeInUp.delay(250).springify()} style={[styles.evoCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.evoHeader}>
                <Ionicons name="leaf" size={16} color={stageColor} />
                <Text style={[styles.evoTitle, { color: stageColor }]}>Evolution Progress</Text>
              </View>
              <AnimatedProgressBar progress={progressPercent} color={stageColor} height={8} />
              <Text style={[styles.evoSub, { color: colors.textSecondary }]}>
                {character.evolutionStage || 0} of {maxStages} stages | {stage.description}
              </Text>
              {daysSinceActive > 0 && (
                <View style={[styles.warnRow, { backgroundColor: penalty > 0.25 ? '#FF525222' : '#FFA72622' }]}>
                  <Ionicons name={penalty > 0.25 ? 'alert-circle' : 'warning'} size={14} color={penalty > 0.25 ? '#FF5252' : '#FFA726'} />
                  <Text style={[styles.warnText, { color: penalty > 0.25 ? '#FF5252' : '#FFA726' }]}>
                    {daysSinceActive} day(s) inactive | -{Math.round(penalty * 100)}% XP penalty
                  </Text>
                </View>
              )}
            </Animated.View>

            <DailyReward character={character} onClaim={handleClaimReward} />

            <Animated.View entering={FadeInDown.delay(260).springify()} style={[styles.quoteCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.quoteIconWrap}>
                <Ionicons name="chatbubble-ellipses" size={14} color={colors.accentSecondary} />
              </View>
              <Text style={[styles.quoteText, { color: colors.accentSecondary }]}>"{quote.text}"</Text>
              <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>- {quote.author}</Text>
            </Animated.View>

            <View style={styles.progressRow}>
              <MiniCard
                icon="checkmark-circle"
                iconColor="#4CAF50"
                title="Daily Progress"
                subtitle={`${todayStats.completed} / ${DAILY_GOAL} tasks`}
                progress={dailyProgress}
                progressColor="#4CAF50"
                delay={300}
                colors={colors}
              />
              <MiniCard
                icon="calendar"
                iconColor={colors.info}
                title="Weekly"
                subtitle={`${weeklyStats.completed} completed`}
                progress={weeklyPercent}
                progressColor={colors.info}
                delay={330}
                colors={colors}
              />
            </View>

            <View style={styles.progressRow}>
              <MiniCard
                icon="trending-up"
                iconColor={colors.accent}
                title="XP to Next Level"
                subtitle={`${xpForNext > 0 ? xpForNext : 0} XP to Level ${levelInfo.level + 1}`}
                progress={xpPercent}
                progressColor={colors.accent}
                delay={360}
                colors={colors}
              />
              <MiniCard
                icon="flame"
                iconColor="#FF5722"
                title="Current Streak"
                subtitle={streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} streak` : 'Start a streak!'}
                progress={Math.min((streak / 7) * 100, 100)}
                progressColor="#FF5722"
                delay={390}
                colors={colors}
              />
            </View>

            {topPriorityTask && (() => {
              const diff = DIFFICULTIES[topPriorityTask.difficulty];
              return (
                <Animated.View entering={FadeInDown.delay(420).springify()} style={[styles.priorityCard, { borderLeftColor: diff?.color || colors.accent, backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <View style={styles.priorityHeader}>
                    <Ionicons name="flag" size={16} color={diff?.color || colors.accent} />
                    <Text style={[styles.priorityLabel, { color: colors.textMuted }]}>Top Priority</Text>
                  </View>
                  <Text style={[styles.priorityTitle, { color: colors.textPrimary }]}>{topPriorityTask.title}</Text>
                  <View style={styles.priorityMeta}>
                    <View style={[styles.priorityDiff, { backgroundColor: (diff?.color || colors.accent) + '22' }]}>
                      <Text style={[styles.priorityDiffText, { color: diff?.color || colors.accent }]}>{diff?.label || 'Task'}</Text>
                    </View>
                    <Text style={[styles.priorityXp, { color: colors.accent }]}>+{diff?.xp || 0} XP</Text>
                  </View>
                </Animated.View>
              );
            })()}

            {recentAchievements.length > 0 && (
              <Animated.View entering={FadeInDown.delay(450).springify()} style={[styles.achievementsSection, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.achievementsHeaderLeft}>
                    <Ionicons name="trophy" size={16} color={colors.accent} />
                    <Text style={[styles.achievementsSectionTitle, { color: colors.accent }]}>Recent Achievements</Text>
                  </View>
                  <PressableScale onPress={() => navigation.navigate('Stats')}>
                    <Text style={[styles.achSeeAll, { color: colors.accent }]}>See All</Text>
                  </PressableScale>
                </View>
                {recentAchievements.slice(0, 3).map((a, i) => {
                  const def = ACHIEVEMENTS.find(d => d.id === a.id);
                  return (
                    <AchievementRow
                      key={a.id}
                      icon={def?.icon || 'star'}
                      iconColor={colors.accent}
                      title={def?.name || a.id}
                      subtitle={def?.description || ''}
                      delay={460 + i * 40}
                      isNew={newAchievements.some(n => n.id === a.id)}
                      colors={colors}
                    />
                  );
                })}
              </Animated.View>
            )}

            <View style={styles.statsRow}>
              {statsCards.map((stat, i) => (
                <StatCard key={i} {...stat} delay={500 + i * 80} colors={colors} />
              ))}
            </View>

            <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Tasks</Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{tasks.length} active</Text>
              </View>
              <PressableScale
                style={[styles.seeAllBtn, { backgroundColor: colors.accent + '15' }]}
                onPress={() => navigation.navigate('Tasks')}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>See All</Text>
              </PressableScale>
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
              <View style={[styles.emptyCircle, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Ionicons name="flag-outline" size={36} color={colors.accent} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No tasks yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap Tasks and add your first quest!</Text>
            </Animated.View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
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
  stageName: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 3 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },
  titlePill: { backgroundColor: '#FFD70022', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3, marginTop: 6 },
  titlePillText: { color: '#FFD700', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  goldBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF980022',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6,
  },
  goldText: { color: '#FF9800', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  evoCard: {
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  evoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  evoTitle: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
  evoBarOuter: { height: 8, backgroundColor: '#2A2A3E', borderRadius: 4, overflow: 'hidden' },
  evoBarFill: { height: '100%', borderRadius: 4 },
  evoSub: { color: '#666', fontSize: 11, marginTop: 6 },
  warnRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 8, borderRadius: 8 },
  warnText: { fontSize: 11, fontWeight: '600', marginLeft: 6 },
  quoteCard: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  quoteIconWrap: { marginBottom: 6 },
  quoteText: { color: '#A78BFA', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  quoteAuthor: { color: '#666', fontSize: 11, marginTop: 4, textAlign: 'right' },
  progressRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8 },
  miniCard: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 12,
    marginHorizontal: 3, borderWidth: 1, borderColor: '#2A2A3E',
  },
  miniHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  miniIconWrap: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2A2A3E',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  miniTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  miniBarOuter: { height: 6, backgroundColor: '#2A2A3E', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  miniBarFill: { height: '100%', borderRadius: 3 },
  miniSub: { color: '#666', fontSize: 10, marginTop: 2 },
  priorityCard: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#2A2A3E', borderLeftWidth: 4,
  },
  priorityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  priorityLabel: { color: '#888', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 },
  priorityTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  priorityMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priorityDiff: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginRight: 8 },
  priorityDiffText: { fontSize: 10, fontWeight: '700' },
  priorityXp: { color: '#FFD700', fontSize: 11, fontWeight: '600' },
  achievementsSection: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  achievementsHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  achievementsSectionTitle: { color: '#FFD700', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  achSeeAll: { color: '#FFD700', fontSize: 11, fontWeight: '600' },
  achievementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A3E' },
  achievementIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  achievementInfo: { flex: 1 },
  achievementTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  achievementSub: { color: '#666', fontSize: 11, marginTop: 1 },
  newBadge: { backgroundColor: '#FFD70022', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { color: '#FFD700', fontSize: 9, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, marginVertical: 12 },
  statCard: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 10, marginHorizontal: 3,
    alignItems: 'center', borderWidth: 1,
  },
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
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
});
