import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function XPBar({ current, required, nextRequired, level, title }) {
  const pct = Math.min(Math.max((current - required) / Math.max(nextRequired - required, 1) * 100, 0), 100);
  const fillWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    fillWidth.value = withTiming(pct, { duration: 1000, easing: Easing.out(Easing.cubic) });
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1, true
    );
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelText}>Lv.{level} {title}</Text>
        <Text style={styles.xpText}>{current} / {nextRequired} XP</Text>
      </View>
      <View style={styles.barOuter}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <View style={styles.barBg}>
          <Animated.View style={[styles.barFillWrapper, barStyle]}>
            <LinearGradient
              colors={['#FFD700', '#FFA000', '#FF6F00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barFill}
            />
          </Animated.View>
        </View>
        <View style={styles.pipContainer}>
          {[25, 50, 75].map(pip => (
            <View
              key={pip}
              style={[styles.pip, { left: `${pip}%` }, pct >= pip && styles.pipActive]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelText: { color: '#FFD700', fontWeight: '800', fontSize: 15 },
  xpText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  barOuter: { position: 'relative', height: 18 },
  glow: {
    position: 'absolute', top: -4, left: -2, right: -2, bottom: -4,
    borderRadius: 14, backgroundColor: '#FFD700',
  },
  barBg: {
    height: 14, backgroundColor: '#1A1A2E', borderRadius: 7, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  barFillWrapper: { height: '100%', borderRadius: 7, overflow: 'hidden' },
  barFill: { width: '100%', height: '100%' },
  pipContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  pip: {
    position: 'absolute', width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#333', top: '50%', transform: [{ translateY: -1.5 }],
  },
  pipActive: { backgroundColor: '#FFD700' },
});
