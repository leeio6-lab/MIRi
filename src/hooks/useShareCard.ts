import { useCallback } from 'react';
import * as Sharing from 'expo-sharing';
import { analytics } from '../services/analytics';

export function useShareCard() {
  const share = useCallback(async (uri: string, type: 'saju' | 'face' | 'compatibility') => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return false;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'MIRi 분석 결과 공유',
      });

      analytics.track('share_card', { type });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { share };
}
