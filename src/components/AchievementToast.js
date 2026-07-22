import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, runOnJS, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function AchievementToast({ achievement, visible, onComplete }) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible && achievement) {
      translateY.value = withSequence(
        withTiming(20, { duration: 400, easing: Easing.out(Easing.back) }),
        withDelay(2500, withTiming(-100, { duration: 300, easing: Easing.in(Easing.ease) }))
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(2500, withTiming(0, { duration: 200 }, (finished) => {
          if (finished && onComplete) runOnJS(onComplete)();
        }))
      );
      scale.value = withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.back) }),
        withDelay(2500, withTiming(0.8, { duration: 200 }))
      );
    }
  }, [visible, achievement]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible || !achievement) return null;

  return (
    <Animated.View style={[styles.toast, animStyle]}>
      <View style={styles.toastIconWrap}>
        <Ionicons name="trophy" size={20} color="#FFD700" />
      </View>
      <View style={styles.toastContent}>
        <Text style={styles.toastLabel}>Achievement Unlocked!</Text>
        <Text style={styles.toastTitle}>{achievement.name}</Text>
        <Text style={styles.toastDesc}>{achievement.description}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 0, left: 16, right: 16, zIndex: 9999,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#FFD700',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  toastIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFD70022',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  toastContent: { flex: 1 },
  toastLabel: { color: '#FFD700', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  toastTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 2 },
  toastDesc: { color: '#aaa', fontSize: 11, marginTop: 1 },
});
