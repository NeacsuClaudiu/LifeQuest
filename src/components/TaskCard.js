import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DIFFICULTIES, CATEGORIES } from '../data/TaskDatabase';
import ConfettiOverlay from './ConfettiOverlay';

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

function SwipeableCard({ children, onSwipeComplete, enabled = true }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerComplete = useCallback(() => {
    setShowConfetti(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setShowConfetti(false);
      onSwipeComplete && onSwipeComplete();
    }, 800);
  }, [onSwipeComplete]);

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(40)
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = Math.min(e.translationX, 150);
        opacity.value = 1 - (e.translationX / 300);
      }
    })
    .onEnd((e) => {
      if (e.translationX > 100) {
        translateX.value = withTiming(300, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(triggerComplete)();
        });
      } else {
        translateX.value = withSpring(0);
        opacity.value = withTiming(1, { duration: 200 });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeIndicator}>
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <Text style={styles.swipeIndicatorText}>DONE</Text>
      </View>
      <Animated.View style={animStyle}>
        <GestureDetector gesture={panGesture}>
          {children}
        </GestureDetector>
      </Animated.View>
      <ConfettiOverlay visible={showConfetti} />
    </View>
  );
}

export default function TaskCard({ task, onComplete, onDelete, compact = false }) {
  const difficulty = DIFFICULTIES[task.difficulty];
  const category = CATEGORIES.find(c => c.id === task.category) || CATEGORIES[CATEGORIES.length - 1];
  const completed = task.completed;

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete && onComplete(task);
  };

  if (compact) {
    return (
      <SwipeableCard onSwipeComplete={() => onComplete && onComplete(task)} enabled={!completed}>
        <Pressable
          style={[styles.compactCard, completed && styles.completedCard]}
          onPress={handleComplete}
          onLongPress={() => onDelete && onDelete(task)}
        >
          <View style={[styles.compactIconWrap, { backgroundColor: category.color + '22' }]}>
            <Image source={CATEGORY_ASSETS[task.category]} style={styles.categoryImg} />
          </View>
          <View style={styles.compactInfo}>
            <Text style={[styles.compactTitle, completed && styles.completedText]} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.compactMeta}>
              {difficulty.label} · {difficulty.xp} XP
            </Text>
          </View>
          {!completed && (
            <View style={[styles.difficultyBadge, { backgroundColor: difficulty.color + '33' }]}>
              <Text style={[styles.badgeText, { color: difficulty.color }]}>+{difficulty.xp}</Text>
            </View>
          )}
          {completed && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
        </Pressable>
      </SwipeableCard>
    );
  }

  return (
    <SwipeableCard onSwipeComplete={() => onComplete && onComplete(task)} enabled={!completed}>
      <Pressable
        style={[styles.card, completed && styles.completedCard]}
        onPress={handleComplete}
        onLongPress={() => onDelete && onDelete(task)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.categoryPill, { backgroundColor: category.color + '22' }]}>
            <Image source={CATEGORY_ASSETS[task.category]} style={styles.categoryImgSmall} />
            <Text style={[styles.categoryLabel, { color: category.color }]}>{category.label}</Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: difficulty.color + '33' }]}>
            <Text style={[styles.badgeText, { color: difficulty.color }]}>{difficulty.label}</Text>
          </View>
        </View>
        <Text style={[styles.title, completed && styles.completedText]}>{task.title}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.xpRow}>
            <Ionicons name="flash" size={14} color="#FFD700" />
            <Text style={styles.xpText}>{difficulty.xp} XP</Text>
          </View>
          {!completed && (
            <Text style={styles.swipeHint}>swipe →</Text>
          )}
        </View>
      </Pressable>
    </SwipeableCard>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { position: 'relative', overflow: 'hidden' },
  swipeIndicator: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#4CAF50', borderRadius: 16,
    justifyContent: 'center', paddingLeft: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  swipeIndicatorText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  card: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16,
    marginVertical: 6, marginHorizontal: 0,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  completedCard: { opacity: 0.5, borderColor: '#4CAF50' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  categoryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 'auto' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10, lineHeight: 22 },
  completedText: { textDecorationLine: 'line-through', color: '#666' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpText: { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  swipeHint: { color: '#444', fontSize: 11, fontStyle: 'italic' },
  compactCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E',
    borderRadius: 14, padding: 12, marginVertical: 4, marginHorizontal: 0,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  compactIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  categoryImg: { width: 28, height: 28 },
  categoryImgSmall: { width: 16, height: 16 },
  compactInfo: { flex: 1 },
  compactTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  compactMeta: { color: '#888', fontSize: 11, marginTop: 2 },
});
