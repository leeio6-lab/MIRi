import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyeongriLogoProps {
  variant?: 'full' | 'symbol' | 'stacked';
  size?: number;
  color?: string;
  showHanja?: boolean;
}

export function MyeongriLogo({
  variant = 'full',
  size = 32,
  color = '#1A1A1A',
  showHanja,
}: MyeongriLogoProps) {
  const hanja = showHanja ?? (variant !== 'symbol');

  // symbol: 한자 1글자
  if (variant === 'symbol') {
    return <Text style={{ fontSize: size, fontWeight: '200', color }}>命</Text>;
  }

  // stacked: 세로 배치 (홈 헤더용)
  if (variant === 'stacked') {
    return (
      <View style={styles.stacked}>
        {hanja && (
          <Text style={[styles.hanja, { fontSize: 13, color, opacity: 0.35, letterSpacing: 5, marginBottom: 0 }]}>
            命理
          </Text>
        )}
        <Text style={[styles.wordmark, { fontSize: size, color, letterSpacing: 8 }]}>
          명리
        </Text>
        <Text style={styles.tagline}>운명의 이치를 읽다</Text>
      </View>
    );
  }

  // full: 가로 배치 (결과 상단 등)
  return (
    <View style={styles.full}>
      <Text style={[styles.wordmark, { fontSize: size * 0.75, color, letterSpacing: 6 }]}>
        명리
      </Text>
      {hanja && (
        <Text style={[styles.hanja, { fontSize: size * 0.28, color, opacity: 0.2, letterSpacing: 2, marginLeft: 6 }]}>
          命理
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stacked: {
    alignItems: 'center',
  },
  full: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmark: {
    fontWeight: '200',
  },
  hanja: {
    fontWeight: '400',
  },
  tagline: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '400',
    letterSpacing: 2,
    marginTop: 6,
  },
});
