import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { getEvolutionStage, getEvolutionSprite, getEvolutionColor, getXpPenalty, getElement } from '../data/CharacterData';

export default function CharacterView({ character, size = 'large', animated = true }) {
  const element = character.element || 'plant';
  const stage = getEvolutionStage(element, character.evolutionStage || 0);
  const sizeMap = { small: 80, medium: 120, large: 160 };
  const imgSize = sizeMap[size] || 160;
  const color = getEvolutionColor(element);

  const floatAnim = useSharedValue(0);
  const wiltAnim = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      );
    }
  }, []);

  React.useEffect(() => {
    const penalty = getXpPenalty(character);
    wiltAnim.value = withTiming(1 - penalty, { duration: 500 });
  }, [character.daysSkipped]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const wiltStyle = useAnimatedStyle(() => ({
    opacity: wiltAnim.value,
    transform: [{ scale: 0.85 + (wiltAnim.value * 0.15) }],
  }));

  const sprite = getEvolutionSprite(element, character.evolutionStage || 0);
  const penalty = getXpPenalty(character);

  return (
    <Animated.View style={[styles.container, floatStyle]}>
      <View style={styles.centerWrap}>
        <View style={[styles.glowOuter, { width: imgSize + 40, height: imgSize + 40, borderRadius: (imgSize + 40) / 2, borderColor: color + '22' }]} />
        <View style={[styles.glowInner, { width: imgSize + 10, height: imgSize + 10, borderRadius: (imgSize + 10) / 2, borderColor: color + '33' }]} />
        {penalty > 0 && (
          <View style={[styles.wiltOverlay, { width: imgSize + 40, height: imgSize + 40, borderRadius: (imgSize + 40) / 2, backgroundColor: `rgba(139, 69, 19, ${penalty * 0.3})` }]} />
        )}
        <Animated.View style={wiltStyle}>
          <View style={[styles.circleClip, { width: imgSize, height: imgSize, borderRadius: imgSize / 2, borderColor: color + '44', backgroundColor: color + '11' }]}>
            <Image source={sprite} style={{ width: imgSize, height: imgSize }} resizeMode="cover" />
          </View>
        </Animated.View>
      </View>
      <Text style={[styles.stageName, { color }]}>{stage.name}</Text>
      {penalty > 0 && (
        <Text style={styles.penaltyText}>-{Math.round(penalty * 100)}% XP</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  centerWrap: { alignItems: 'center', justifyContent: 'center' },
  circleClip: {
    overflow: 'hidden',
    borderWidth: 2,
  },
  glowOuter: {
    position: 'absolute', borderWidth: 1,
    opacity: 0.6,
  },
  glowInner: {
    position: 'absolute', borderWidth: 1,
    opacity: 0.4,
  },
  wiltOverlay: {
    position: 'absolute',
  },
  stageName: {
    fontSize: 11, fontWeight: '700', marginTop: 4,
    letterSpacing: 1,
  },
  penaltyText: {
    fontSize: 10, color: '#FF5252', fontWeight: '700', marginTop: 2,
  },
});
