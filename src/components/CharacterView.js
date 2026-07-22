import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { getCharacterStage } from '../data/CharacterData';

const STAGE_SPRITES = {
  Seedling: require('../../assets/characters/seedling.png'),
  Sprout: require('../../assets/characters/sprout.png'),
  Bloom: require('../../assets/characters/bloom.png'),
  Guardian: require('../../assets/characters/guardian.png'),
  Phoenix: require('../../assets/characters/phoenix.png'),
};

export default function CharacterView({ character, size = 'large', animated = true }) {
  const stage = getCharacterStage(character.level);
  const sizeMap = { small: 100, medium: 140, large: 200 };
  const imgSize = sizeMap[size] || 200;

  const floatAnim = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      floatAnim.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      );
    }
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const sprite = STAGE_SPRITES[stage.label] || STAGE_SPRITES.Seedling;

  return (
    <Animated.View style={[styles.container, floatStyle]}>
      <View style={[styles.glowRing, { width: imgSize + 30, height: imgSize + 30, borderColor: stage.color + '44' }]} />
      <Image source={sprite} style={[styles.sprite, { width: imgSize, height: imgSize }]} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute', borderRadius: 999, borderWidth: 2,
    opacity: 0.5,
  },
  sprite: { borderRadius: 16 },
});
