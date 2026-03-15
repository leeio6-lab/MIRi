import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Share, Alert } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { Button } from './Button';

const { width } = Dimensions.get('window');

interface ShareCardProps {
  type: 'saju' | 'face' | 'compatibility';
  score: number;
  summary: string;
  extraInfo?: string;
}

export function ShareCard({ type, score, summary, extraInfo }: ShareCardProps) {
  const { t } = useTranslation();
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const typeLabels = { saju: t('share.sajuType'), face: t('share.faceType'), compatibility: t('share.compatType') };
  const typeChars = { saju: '命', face: '相', compatibility: '緣' };

  const shareText = `[MIRi] ${typeLabels[type]}: ${score}/100\n${summary}\n\n${t('share.footerText')}`;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      // 1. Try native image share (mobile)
      if (Platform.OS !== 'web' && viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: t('share.dialogTitle'),
          });
          setSharing(false);
          return;
        }
      }

      // 2. Try Web Share API (modern browsers + PWA)
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: `MIRi ${typeLabels[type]}`,
          text: shareText,
        });
        setSharing(false);
        return;
      }

      // 3. Try React Native Share (cross-platform text share)
      if (Platform.OS !== 'web') {
        await Share.share({
          message: shareText,
          title: `MIRi ${typeLabels[type]}`,
        });
        setSharing(false);
        return;
      }

      // 4. Fallback: copy to clipboard (web)
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        Alert.alert(t('common.copied'), t('common.copiedDesc'));
      }
    } catch (err: any) {
      // User cancelled share — not an error
      if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
        // silently ignore
      } else {
        console.error('Share failed:', err);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <View>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>MIRi</Text>
            <Text style={styles.typeChar}>{typeChars[type]}</Text>
          </View>

          {/* Type label */}
          <Text style={styles.typeLabel}>{typeLabels[type]}</Text>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>

          {/* Summary */}
          <Text style={styles.summary} numberOfLines={4}>{summary}</Text>

          {extraInfo && <Text style={styles.extra}>{extraInfo}</Text>}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('share.footerText')}</Text>
            <Text style={styles.disclaimer}>{t('share.entertainmentPurpose')}</Text>
          </View>
        </View>
      </ViewShot>

      <Button
        title={sharing ? t('common.shareInProgress') : t('common.share')}
        onPress={handleShare}
        variant="secondary"
        style={styles.shareBtn}
        loading={sharing}
        disabled={sharing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gold.primary,
    letterSpacing: 4,
  },
  typeChar: {
    fontSize: 28,
    color: theme.colors.gold.muted,
    opacity: 0.5,
  },
  typeLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  score: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.gold.primary,
  },
  scoreMax: {
    fontSize: 18,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
  },
  summary: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  extra: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
    paddingTop: theme.spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.gold.muted,
  },
  disclaimer: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
  },
  shareBtn: {
    marginTop: theme.spacing.md,
  },
});
