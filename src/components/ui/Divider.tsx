import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

interface DividerProps {
  style?: ViewStyle;
  color?: string;
  opacity?: number;
}

export const Divider = React.memo(function Divider({
  style,
  color = '#E8B04A',
  opacity = 0.1,
}: DividerProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.lineWrap}>
        <Svg width="100%" height={1}>
          <Line
            x1="0"
            y1="0.5"
            x2="100%"
            y2="0.5"
            stroke={color}
            strokeWidth={0.5}
            opacity={opacity}
          />
        </Svg>
      </View>
      <Svg width={6} height={6} style={styles.diamond}>
        <Rect
          x={3}
          y={0}
          width={4}
          height={4}
          fill={color}
          opacity={opacity * 1.5}
          rotation={45}
          origin="3, 2"
        />
      </Svg>
      <View style={styles.lineWrap}>
        <Svg width="100%" height={1}>
          <Line
            x1="0"
            y1="0.5"
            x2="100%"
            y2="0.5"
            stroke={color}
            strokeWidth={0.5}
            opacity={opacity}
          />
        </Svg>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  lineWrap: {
    flex: 1,
    height: 1,
  },
  diamond: {
    marginHorizontal: 8,
  },
});
