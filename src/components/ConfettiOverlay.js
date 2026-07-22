import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const PARTICLE_COUNT = 24;
const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#FF9FF3', '#54A0FF', '#FFA502', '#2ED573'];

function Particle({ index, visible }) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const delay = index * 40;
    const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
    const distance = 80 + Math.random() * 120;
    const xDist = Math.cos(angle) * distance;
    const yDist = Math.sin(angle) * distance - 60;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: xDist, duration: 800, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: yDist, duration: 800, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 360 * (index % 2 === 0 ? 1 : -1), duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  const spin = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 8 + Math.random() * 6,
        height: 8 + Math.random() * 6,
        borderRadius: Math.random() > 0.5 ? 50 : 2,
        backgroundColor: COLORS[index % COLORS.length],
        transform: [
          { translateX },
          { translateY },
          { rotate: spin },
          { scale },
        ],
      }}
    />
  );
}

export default function ConfettiOverlay({ visible, onComplete }) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      timeoutRef.current = setTimeout(() => {
        onComplete && onComplete();
      }, 1200);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} index={i} visible={visible} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
