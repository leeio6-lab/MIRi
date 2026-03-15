import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { theme } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

interface ElementRadarProps {
  balance: { wood: number; fire: number; earth: number; metal: number; water: number };
  size?: number;
}

const ELEMENTS = [
  { key: 'wood', hanja: '木', ko: '목', color: '#3D8B37', angle: -90 },
  { key: 'fire', hanja: '火', ko: '화', color: '#C4503D', angle: -18 },
  { key: 'earth', hanja: '土', ko: '토', color: '#A68B5B', angle: 54 },
  { key: 'metal', hanja: '金', ko: '금', color: '#8C8C8C', angle: 126 },
  { key: 'water', hanja: '水', ko: '수', color: '#2C5F8A', angle: 198 },
] as const;

function polar(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function pts(values: number[], max: number, r: number, cx: number, cy: number) {
  return ELEMENTS.map((el, i) => {
    const v = Math.max(values[i] / max, 0.06) * r;
    const p = polar(el.angle, v, cx, cy);
    return `${p.x},${p.y}`;
  }).join(' ');
}

export function ElementRadar({ balance, size: sizeProp }: ElementRadarProps) {
  // 화면 너비 기반 큰 사이즈 (패딩 빼고 꽉 채움)
  const size = sizeProp ?? Math.min(SCREEN_W - 80, 320);
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 40;
  const values = ELEMENTS.map(el => balance[el.key as keyof typeof balance]);
  const max = Math.max(...values, 1);
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {/* 격자 */}
        {rings.map(r => (
          <Polygon
            key={r}
            points={ELEMENTS.map(el => {
              const p = polar(el.angle, R * r, cx, cy);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={0.8}
          />
        ))}

        {/* 축 */}
        {ELEMENTS.map(el => {
          const p = polar(el.angle, R, cx, cy);
          return <Line key={el.key} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,0,0,0.04)" strokeWidth={0.8} />;
        })}

        {/* 데이터 영역 */}
        <Polygon
          points={pts(values, max, R, cx, cy)}
          fill="rgba(28,28,30,0.07)"
          stroke="#1C1C1E"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* 꼭짓점 */}
        {ELEMENTS.map((el, i) => {
          const v = Math.max(values[i] / max, 0.06) * R;
          const p = polar(el.angle, v, cx, cy);
          return <Circle key={el.key} cx={p.x} cy={p.y} r={3.5} fill={el.color} />;
        })}

        {/* 라벨: 한자 + 수치 */}
        {ELEMENTS.map((el, i) => {
          const p = polar(el.angle, R + 26, cx, cy);
          return (
            <React.Fragment key={el.key}>
              <SvgText
                x={p.x} y={p.y - 7}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={16} fontWeight="700" fill={el.color}
              >
                {el.hanja}
              </SvgText>
              <SvgText
                x={p.x} y={p.y + 10}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={11} fontWeight="600" fill={theme.colors.text.secondary}
              >
                {values[i]}%
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* 하단 범례 */}
      <View style={styles.legend}>
        {ELEMENTS.map(el => (
          <View key={el.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: el.color }]} />
            <Text style={styles.legendText}>{el.ko}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});
