import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { BackButton } from '../../src/components/ui/BackButton';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    const canAsk = permission.canAskAgain;
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>카메라 권한 필요</Text>
        <Text style={styles.permissionText}>
          {canAsk
            ? t('face.permissionNeeded')
            : t('face.permissionDenied')}
        </Text>
        {canAsk ? (
          <Button title={t('face.grantPermission')} onPress={requestPermission} />
        ) : (
          <Button
            title={t('face.goToSettings')}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          />
        )}
        <BackButton />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (photo?.uri) {
        // Navigate to face tab with the image
        router.replace({
          pathname: '/(tabs)/face',
          params: { imageUri: photo.uri },
        });
      }
    } catch (err) {
      console.error('Failed to take picture:', err);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
            <Text style={styles.flipText}>전환</Text>
          </TouchableOpacity>
        </View>

        {/* Face guide overlay */}
        <View style={styles.guideContainer}>
          <View style={styles.faceOval} />
          <Text style={styles.guideText}>{t('face.guide')}</Text>
        </View>

        {/* Guide points */}
        <View style={styles.pointsOverlay}>
          {/* Forehead */}
          <View style={[styles.guidePoint, { top: '22%', left: '50%' }]}>
            <View style={styles.pointDot} />
          </View>
          {/* Left eye */}
          <View style={[styles.guidePoint, { top: '38%', left: '38%' }]}>
            <View style={styles.pointDot} />
          </View>
          {/* Right eye */}
          <View style={[styles.guidePoint, { top: '38%', left: '62%' }]}>
            <View style={styles.pointDot} />
          </View>
          {/* Nose */}
          <View style={[styles.guidePoint, { top: '48%', left: '50%' }]}>
            <View style={styles.pointDot} />
          </View>
          {/* Mouth */}
          <View style={[styles.guidePoint, { top: '58%', left: '50%' }]}>
            <View style={styles.pointDot} />
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  permissionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  flipText: {
    color: '#fff',
    fontSize: 14,
  },
  guideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: width * 0.6,
    height: width * 0.8,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: theme.colors.gold.primary,
    opacity: 0.5,
  },
  guideText: {
    color: theme.colors.gold.light,
    fontSize: 13,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  pointsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  guidePoint: {
    position: 'absolute',
    marginLeft: -6,
    marginTop: -6,
  },
  pointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.gold.primary,
    opacity: 0.4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: theme.colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.gold.primary,
  },
});
