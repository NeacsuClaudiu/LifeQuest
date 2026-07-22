import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity: pulseAnim },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ width = '100%', height = 80, borderRadius = 16 }) {
  return (
    <View style={[styles.card, { width, height, borderRadius }]}>
      <View style={styles.cardRow}>
        <Skeleton width={44} height={44} borderRadius={14} />
        <View style={styles.cardContent}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="80%" height={8} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width="40%" height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#2A2A3E',
  },
  card: {
    backgroundColor: '#1A1A2E',
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
});
