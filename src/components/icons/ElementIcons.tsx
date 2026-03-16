import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * 금(金) Metal - Diamond/gem shape with internal facet lines
 */
export function MetalIcon({ size = 48, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Diamond outline */}
      <Path
        d="M24 6 L40 20 L24 42 L8 20 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Top facet line */}
      <Line
        x1={14}
        y1={20}
        x2={34}
        y2={20}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Internal facet rays from bottom point */}
      <Line
        x1={24}
        y1={42}
        x2={14}
        y2={20}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={24}
        y1={42}
        x2={34}
        y2={20}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Top crown facet lines */}
      <Line
        x1={24}
        y1={6}
        x2={18}
        y2={20}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={24}
        y1={6}
        x2={30}
        y2={20}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 목(木) Wood - Minimal tree with trunk, branches, and roots
 */
export function WoodIcon({ size = 48, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Vertical trunk */}
      <Line
        x1={24}
        y1={10}
        x2={24}
        y2={42}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Right branch - upper */}
      <Path
        d="M24 16 C28 14, 33 10, 36 8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Left branch - upper */}
      <Path
        d="M24 14 C20 12, 15 11, 12 10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Right branch - middle */}
      <Path
        d="M24 24 C28 22, 32 19, 35 17"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Left branch - lower */}
      <Path
        d="M24 22 C20 21, 16 20, 13 19"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Right root */}
      <Path
        d="M24 42 C28 43, 32 45, 35 46"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Left root */}
      <Path
        d="M24 42 C20 43, 16 45, 13 46"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * 수(水) Water - Three stacked wave curves
 */
export function WaterIcon({ size = 48, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Top wave */}
      <Path
        d="M8 16 C12 12, 16 12, 20 16 C24 20, 28 20, 32 16 C36 12, 40 12, 44 16"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Middle wave */}
      <Path
        d="M6 24 C10 20, 14 20, 18 24 C22 28, 26 28, 30 24 C34 20, 38 20, 42 24"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom wave */}
      <Path
        d="M8 32 C12 28, 16 28, 20 32 C24 36, 28 36, 32 32 C36 28, 40 28, 44 32"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * 화(火) Fire - Central flame with two smaller side flames, S-curve shapes
 */
export function FireIcon({ size = 48, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Center large flame */}
      <Path
        d="M24 4 C24 4, 18 16, 18 24 C18 28, 20 34, 24 38 C28 34, 30 28, 30 24 C30 16, 24 4, 24 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner flame detail (S-curve) */}
      <Path
        d="M24 14 C22 20, 22 26, 24 32 C24 28, 26 22, 24 14"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Left small flame */}
      <Path
        d="M14 22 C14 22, 11 28, 11 32 C11 35, 12.5 38, 14 40 C15.5 38, 17 35, 17 32 C17 28, 14 22, 14 22"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right small flame */}
      <Path
        d="M34 22 C34 22, 31 28, 31 32 C31 35, 32.5 38, 34 40 C35.5 38, 37 35, 37 32 C37 28, 34 22, 34 22"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Base ember line */}
      <Path
        d="M10 42 C16 39, 20 38, 24 38 C28 38, 32 39, 38 42"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * 토(土) Earth - Large mountain with smaller mountain behind
 */
export function EarthIcon({ size = 48, color = '#E8B04A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Background smaller mountain (behind, to the right) */}
      <Path
        d="M26 16 L38 38 L18 38"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Foreground large mountain */}
      <Path
        d="M20 10 L36 38 L4 38 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Small peak accent on background mountain */}
      <Path
        d="M33 18 L42 38"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Ground line */}
      <Line
        x1={2}
        y1={38}
        x2={46}
        y2={38}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
