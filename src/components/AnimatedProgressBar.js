import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

export default function AnimatedProgressBar({ progress, color, height = 6, borderRadius = 3, backgroundColor }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(progress, 100),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={{ height, backgroundColor: backgroundColor || '#2A2A3E', borderRadius, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius,
          backgroundColor: color,
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}
