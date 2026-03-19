import React, { useState, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareImageCard, type ShareData } from '../share/ShareImageCard';
import { Button } from './Button';

interface ShareCardProps {
  data: ShareData;
}

/** 웹: html-to-image로 DOM 캡처 → Blob */
async function captureWeb(node: HTMLElement): Promise<Blob | null> {
  try {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(node, { quality: 0.95, pixelRatio: 2 });
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (e) {
    console.error('[ShareCard] web capture:', e);
    return null;
  }
}

export function ShareCard({ data }: ShareCardProps) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);

  const handleShare = async () => {
    if (sharing || !cardRef.current) return;
    setSharing(true);

    try {
      if (Platform.OS === 'web') {
        const blob = await captureWeb((cardRef.current as any) as HTMLElement);
        if (!blob) { setSharing(false); return; }
        const file = new File([blob], `myeongri-${data.type}.png`, { type: 'image/png' });

        if ((navigator as any).canShare?.({ files: [file] })) {
          await (navigator as any).share({ title: '명리', files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        }
      } else {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 0.95,
          result: 'tmpfile',
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '명리 결과 공유' });
        }
      }
    } catch (e: any) {
      if (!e?.message?.includes('cancel') && !e?.message?.includes('dismiss') && e?.name !== 'AbortError') {
        console.error('[ShareCard]', e);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <View>
      {/* Off-screen: 캡처용 카드 */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareImageCard ref={cardRef} data={data} />
      </View>

      {/* 공유 버튼 */}
      <Button
        title={sharing ? '이미지 생성 중...' : done ? '저장 완료!' : '결과 이미지로 공유'}
        onPress={handleShare}
        loading={sharing}
        disabled={sharing}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    opacity: 0,
  },
  btn: {
    width: '100%',
  },
});
