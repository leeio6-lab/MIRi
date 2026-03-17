import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Share, Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { Button } from './Button';

const { width } = Dimensions.get('window');

const SHARE_BASE_URL = 'https://dist-drab-ten-14.vercel.app/share';

interface ShareCardProps {
  type: 'saju' | 'face' | 'compatibility';
  score: number;
  summary: string;
  title?: string;
  items?: { label: string; value: string }[];
}

function buildShareUrl(props: ShareCardProps): string {
  const params = new URLSearchParams();
  params.set('type', props.type);
  if (props.score > 0) params.set('score', String(props.score));
  if (props.title) params.set('title', props.title);
  if (props.summary) params.set('summary', props.summary);
  if (props.items && props.items.length > 0) {
    params.set('items', JSON.stringify(props.items.slice(0, 5)));
  }
  return `${SHARE_BASE_URL}?${params.toString()}`;
}

export function ShareCard({ type, score, summary, title, items }: ShareCardProps) {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const typeLabels = { saju: t('share.sajuType'), face: t('share.faceType'), compatibility: t('share.compatType') };

  const shareUrl = buildShareUrl({ type, score, summary, title, items });
  const shareText = `[MIRi] ${title || typeLabels[type]}${score > 0 ? ` ${score}점` : ''}\n\n${summary}\n\n${shareUrl}`;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      // 1. Web Share API (URL 포함)
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: `MIRi ${typeLabels[type]}`,
          text: `${title || typeLabels[type]}${score > 0 ? ` ${score}점` : ''}\n${summary}`,
          url: shareUrl,
        });
        return;
      }

      // 2. React Native Share (모바일)
      if (Platform.OS !== 'web') {
        await Share.share({
          message: shareText,
          title: `MIRi ${typeLabels[type]}`,
          url: shareUrl,
        });
        return;
      }

      // 3. Fallback: 클립보드 복사
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
        // silently ignore
      } else {
        console.error('Share failed:', err);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* Preview card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.appName}>MIRi</Text>
          <Text style={styles.typeLabel}>{typeLabels[type]}</Text>
        </View>
        {title && <Text style={styles.title} numberOfLines={2}>{title}</Text>}
        {score > 0 && (
          <Text style={styles.score}>{score}<Text style={styles.scoreUnit}>점</Text></Text>
        )}
        <Text style={styles.summary} numberOfLines={3}>{summary}</Text>
        <Text style={styles.cta}>터치해서 결과 보기 →</Text>
      </View>

      {/* Share buttons */}
      <View style={styles.btnRow}>
        <Button
          title={sharing ? t('common.shareInProgress') : t('common.share')}
          onPress={handleShare}
          style={styles.shareBtn}
          loading={sharing}
          disabled={sharing}
        />
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink} activeOpacity={0.7}>
          <Text style={styles.copyText}>{copied ? t('common.copied') : t('common.share') + ' URL'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  card: {
    width: width - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.gold.primary,
    letterSpacing: 3,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gold.muted,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.gold.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  summary: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  shareBtn: {
    flex: 1,
  },
  copyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.gold.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.primary,
  },
});
