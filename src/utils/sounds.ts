import { Platform } from 'react-native';

/**
 * Web Audio API 기반 사운드 생성 (무설치, 파일 없음)
 * 네이티브에서는 무음 (expo-av 없이 안전하게)
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (!audioCtx && typeof window !== 'undefined' && window.AudioContext) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** 먹물 방울 떨어지는 소리 — 짧은 물방울 */
export function playInkDrop() {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

/** 먹물 퍼지는 소리 — 부드러운 확산음 */
export function playInkSpread() {
  const ctx = getCtx();
  if (!ctx) return;

  // Low rumble
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(80, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.8);
  gain1.gain.setValueAtTime(0.15, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.8);

  // High shimmer
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.6);
  gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc2.start(ctx.currentTime + 0.1);
  osc2.stop(ctx.currentTime + 0.6);
}

/** 결과 등장 — 맑은 종소리 */
export function playReveal() {
  const ctx = getCtx();
  if (!ctx) return;

  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.5);
  });
}
