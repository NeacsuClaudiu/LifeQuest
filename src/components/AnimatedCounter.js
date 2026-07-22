import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

export default function AnimatedCounter({ value, style, duration = 800 }) {
  const displayValue = useSharedValue(0);

  useEffect(() => {
    displayValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    return {};
  });

  return (
    <AnimatedText style={style} value={displayValue} />
  );
}

function AnimatedText({ style, value }) {
  const textRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (textRef.current) {
        textRef.current.setNativeProps({
          text: String(Math.round(value.value)),
        });
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text
      ref={textRef}
      style={style}
    >
      {String(Math.round(value.value))}
    </Text>
  );
}

export function FadeInView({ children, delay = 0, style }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, delay, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 500, delay, easing: Easing.out(Easing.cubic) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
}

export function PulseView({ children, style, loop = false }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    const animate = () => {
      scale.value = withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.sin) }, () => {
        scale.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }, () => {
          if (loop) animate();
        });
      });
    };
    animate();
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
}
