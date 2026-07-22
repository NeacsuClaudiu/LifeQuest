import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DIFFICULTIES, CATEGORIES, PRESET_TASKS } from '../data/TaskDatabase';
import { getLevelInfo, calculateReward, processDayCheck, evolveCharacter, getXpPenalty, getEvolutionStage, getEvolutionColor } from '../data/CharacterData';
import { loadData, saveData, KEYS } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import TaskCard from '../components/TaskCard';
import ConfettiOverlay from '../components/ConfettiOverlay';

const CATEGORY_ASSETS = {
  phone_detox: require('../../assets/categories/phone_detox.png'),
  workout: require('../../assets/categories/workout.png'),
  learning: require('../../assets/categories/learning.png'),
  reading: require('../../assets/categories/reading.png'),
  cleaning: require('../../assets/categories/cleaning.png'),
  mindfulness: require('../../assets/categories/mindfulness.png'),
  health: require('../../assets/categories/health.png'),
  creative: require('../../assets/categories/creative.png'),
  social: require('../../assets/categories/social.png'),
  custom: require('../../assets/categories/custom.png'),
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [character, setCharacter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('custom');
  const [newDifficulty, setNewDifficulty] = useState('medium');
  const [refreshing, setRefreshing] = useState(false);
  const [levelUpConfetti, setLevelUpConfetti] = useState(false);
  const [rewardPopup, setRewardPopup] = useState(null);

  const loadAllData = useCallback(async () => {
    const t = await loadData(KEYS.TASKS, []);
    let c = await loadData(KEYS.CHARACTER);
    if (!c) {
      c = { ...DEFAULT_CHARACTER };
      await saveData(KEYS.CHARACTER, c);
    }
    c = processDayCheck(c);
    await saveData(KEYS.CHARACTER, c);
    setTasks(t);
    setCharacter(c);
  }, []);

  useFocusEffect(useCallback(() => { loadAllData(); }, [loadAllData]));

  const saveTasks = async (newTasks) => {
    setTasks(newTasks);
    await saveData(KEYS.TASKS, newTasks);
  };

  const completeTask = async (task) => {
    const c = character;
    if (!c) return;

    const difficulty = DIFFICULTIES[task.difficulty];
    const rewardXp = calculateReward(difficulty.xp, 1, c.currentStreak || 0, c);
    const now = new Date().toDateString();

    let newStreak = c.currentStreak || 0;
    if (c.lastActiveDate) {
      const lastDate = new Date(c.lastActiveDate).toDateString();
      const diff = (new Date(now) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
      if (diff === 1) newStreak += 1;
      else if (diff > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }

    const updatedTasks = tasks.map(t =>
      t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
    );

    let updatedCharacter = {
      ...c,
      currentXp: (c.currentXp || 0) + rewardXp,
      totalXpEarned: (c.totalXpEarned || 0) + rewardXp,
      tasksCompleted: (c.tasksCompleted || 0) + 1,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, c.longestStreak || 0),
      lastActiveDate: now,
      consecutiveDays: (c.consecutiveDays || 0) + 1,
      daysSkipped: 0,
      stats: { ...c.stats, discipline: (c.stats?.discipline || 0) + 1 },
    };

    const oldLevel = c.level;
    const oldStage = c.evolutionStage || 0;
    const levelInfo = getLevelInfo(updatedCharacter.totalXpEarned);
    updatedCharacter.level = levelInfo.level;

    updatedCharacter = evolveCharacter(updatedCharacter);

    if (levelInfo.level > oldLevel) {
      setLevelUpConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if ((updatedCharacter.evolutionStage || 0) > oldStage) {
      setLevelUpConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await saveData(KEYS.TASKS, updatedTasks);
    await saveData(KEYS.CHARACTER, updatedCharacter);
    setCharacter(updatedCharacter);
    setTasks(updatedTasks);

    setRewardPopup({ xp: rewardXp, task: task.title });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setRewardPopup(null), 2000);
  };

  const deleteTask = (task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Delete Task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const filtered = tasks.filter(t => t.id !== task.id);
        saveTasks(filtered);
      }},
    ]);
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      difficulty: newDifficulty,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    saveTasks([newTask, ...tasks]);
    setNewTitle('');
    setShowModal(false);
  };

  const addPresetTask = (preset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTask = {
      id: Date.now().toString(),
      title: preset.title,
      category: preset.category,
      difficulty: preset.difficulty,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    saveTasks([newTask, ...tasks]);
    setShowPresets(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterDifficulty !== 'all' && t.difficulty !== filterDifficulty) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);
  const penalty = character ? getXpPenalty(character) : 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {rewardPopup && (
          <Animated.View entering={FadeIn} style={[styles.rewardPopup, penalty > 0 && { borderColor: '#FFA726' }]}>
            <Ionicons name="flash" size={24} color="#FFD700" />
            <View>
              <Text style={styles.rewardTitle}>+{rewardPopup.xp} XP</Text>
              {penalty > 0 && (
                <Text style={styles.penaltyLabel}>-{Math.round(penalty * 100)}% penalty applied</Text>
              )}
              <Text style={styles.rewardTask} numberOfLines={1}>{rewardPopup.task}</Text>
            </View>
          </Animated.View>
        )}

        <FlatList
          ListHeaderComponent={
            <>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text style={styles.screenTitle}>Quests</Text>
              </Animated.View>

              {penalty > 0 && (
                <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.penaltyBar}>
                  <Ionicons name="alert-circle" size={16} color="#FF5252" />
                  <Text style={styles.penaltyBarText}>
                    Inactive {character?.daysSkipped || 0} day(s) - XP reduced by {Math.round(penalty * 100)}%
                  </Text>
                </Animated.View>
              )}

              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <FlatList horizontal showsHorizontalScrollIndicator={false}
                  data={['all', ...Object.keys(DIFFICULTIES)]}
                  keyExtractor={d => d}
                  contentContainerStyle={styles.filterContent}
                  renderItem={({ item: d }) => (
                    <TouchableOpacity
                      style={[styles.filterChip, filterDifficulty === d && {
                        backgroundColor: d === 'all' ? '#FFD700' : DIFFICULTIES[d].color,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setFilterDifficulty(d); }}
                    >
                      <Text style={[styles.filterText, filterDifficulty === d && styles.filterTextActive]}>
                        {d === 'all' ? 'ALL' : DIFFICULTIES[d].label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </Animated.View>

              {activeTasks.length > 0 && (
                <Animated.Text entering={FadeIn.delay(300)} style={styles.sectionLabel}>
                  Active ({activeTasks.length})
                </Animated.Text>
              )}
            </>
          }
          data={activeTasks}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(300 + index * 50).springify()}>
              <TaskCard task={item} onComplete={completeTask} onDelete={deleteTask} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.emptyState}>
              <Ionicons name="rocket-outline" size={48} color="#FFD700" />
              <Text style={styles.emptyText}>No active tasks</Text>
              <Text style={styles.emptySubtext}>Tap + to create a quest</Text>
            </Animated.View>
          }
          ListFooterComponent={
            completedTasks.length > 0 ? (
              <>
                <Animated.Text entering={FadeIn.delay(200)} style={[styles.sectionLabel, { marginTop: 20 }]}>
                  Completed ({completedTasks.length})
                </Animated.Text>
                {completedTasks.slice(0, 10).map(item => (
                  <TaskCard key={item.id} task={item} onDelete={deleteTask} compact />
                ))}
              </>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => {
              setRefreshing(true); await loadAllData(); setRefreshing(false);
            }} tintColor="#FFD700" />
          }
          contentContainerStyle={styles.scrollContent}
        />

        <View style={styles.fabRow}>
          <TouchableOpacity style={styles.fabSecondary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPresets(true);
          }}>
            <Ionicons name="list-outline" size={24} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowModal(true);
          }}>
            <Ionicons name="add" size={30} color="#0D0D1A" />
          </TouchableOpacity>
        </View>

        <Modal visible={showModal} transparent animationType="slide">
          <BlurView intensity={40} style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.springify()} style={styles.modal}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>New Quest</Text>
              <TextInput
                style={styles.input}
                placeholder="What's your quest?"
                placeholderTextColor="#555"
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
              <Text style={styles.label}>Category</Text>
              <FlatList horizontal showsHorizontalScrollIndicator={false} data={CATEGORIES}
                keyExtractor={c => c.id}
                renderItem={({ item: cat }) => (
                  <TouchableOpacity
                    style={[styles.pickerChip, newCategory === cat.id && { backgroundColor: cat.color + '44', borderColor: cat.color }]}
                    onPress={() => { Haptics.selectionAsync(); setNewCategory(cat.id); }}
                  >
                    <Text style={styles.pickerChipText}>{cat.icon} {cat.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.diffRow}>
                {Object.entries(DIFFICULTIES).map(([key, val]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.diffChip, newDifficulty === key && { backgroundColor: val.color + '44', borderColor: val.color }]}
                    onPress={() => { Haptics.selectionAsync(); setNewDifficulty(key); }}
                  >
                    <Text style={[styles.diffChipText, newDifficulty === key && { color: val.color }]}>
                      {val.icon} {val.label}
                    </Text>
                    <Text style={styles.diffXp}>+{val.xp} XP</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={addTask}>
                  <Text style={styles.addText}>Add Quest</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </BlurView>
        </Modal>

        <Modal visible={showPresets} transparent animationType="slide">
          <BlurView intensity={40} style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.springify()} style={styles.modal}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Quick Add Quests</Text>
              <FlatList data={PRESET_TASKS} keyExtractor={(item, i) => i.toString()}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
                    <TouchableOpacity style={styles.presetItem} onPress={() => addPresetTask(item)}>
                      <View style={[styles.presetIconWrap, { backgroundColor: (CATEGORIES.find(c => c.id === item.category)?.color || '#666') + '22' }]}>
                        <Image source={CATEGORY_ASSETS[item.category]} style={{ width: 28, height: 28 }} />
                      </View>
                      <View style={styles.presetInfo}>
                        <Text style={styles.presetTitle}>{item.title}</Text>
                        <Text style={styles.presetMeta}>
                          {DIFFICULTIES[item.difficulty].label} · +{DIFFICULTIES[item.difficulty].xp} XP
                        </Text>
                      </View>
                      <Ionicons name="add-circle" size={28} color="#FFD700" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                style={{ maxHeight: 400 }}
              />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPresets(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Modal>

        <ConfettiOverlay visible={levelUpConfetti} onComplete={() => setLevelUpConfetti(false)} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  scrollContent: { paddingBottom: 120 },
  screenTitle: { color: '#fff', fontSize: 28, fontWeight: '900', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  rewardPopup: {
    position: 'absolute', top: 50, alignSelf: 'center', zIndex: 998,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: '#FFD700',
  },
  rewardTitle: { color: '#FFD700', fontSize: 18, fontWeight: '900' },
  penaltyLabel: { color: '#FFA726', fontSize: 10, fontWeight: '700' },
  rewardTask: { color: '#aaa', fontSize: 12, maxWidth: 150 },
  penaltyBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#FF525222', padding: 10, borderRadius: 10,
  },
  penaltyBarText: { color: '#FF5252', fontSize: 12, fontWeight: '600', marginLeft: 8 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1A1A2E', marginRight: 8, borderWidth: 1, borderColor: '#2A2A3E',
  },
  filterText: { color: '#666', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  sectionLabel: { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, paddingHorizontal: 16, paddingVertical: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
  fabRow: { position: 'absolute', bottom: 24, right: 16, flexDirection: 'row', alignItems: 'center' },
  fab: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD700',
    justifyContent: 'center', alignItems: 'center', marginLeft: 12,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabSecondary: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFD70044',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#1A1A2E', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#2A2A3E', borderRadius: 14, padding: 16, color: '#fff', fontSize: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#333',
  },
  label: { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  pickerChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#2A2A3E', marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333',
  },
  pickerChipText: { color: '#fff', fontSize: 13 },
  diffRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  diffChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    backgroundColor: '#2A2A3E', marginRight: 8, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#333',
  },
  diffChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  diffXp: { color: '#FFD700', fontSize: 11, marginTop: 2 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#2A2A3E',
    marginRight: 8, alignItems: 'center',
  },
  cancelText: { color: '#888', fontSize: 16, fontWeight: '600' },
  addBtn: {
    flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#FFD700', marginLeft: 8, alignItems: 'center',
  },
  addText: { color: '#0D0D1A', fontSize: 16, fontWeight: '700' },
  presetItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2A2A3E',
  },
  presetIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  presetInfo: { flex: 1 },
  presetTitle: { color: '#fff', fontSize: 14, fontWeight: '500' },
  presetMeta: { color: '#888', fontSize: 11, marginTop: 2 },
});
