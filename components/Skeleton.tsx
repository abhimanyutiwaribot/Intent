import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet } from 'react-native';
import { useAppTheme } from '../app/_layout';
import { Colors } from '../constants/Colors';

interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: object;
}

const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = 8, style }) => {
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default Skeleton;
