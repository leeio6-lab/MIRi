import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
];

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentLabel = LANGUAGES.find((l) => l.code === i18n.language)?.label ?? 'English';

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.trigger}>
        <Text style={styles.triggerText}>{currentLabel}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.menu}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.item}
                onPress={() => {
                  i18n.changeLanguage(lang.code);
                  setVisible(false);
                }}
              >
                <Text style={[styles.itemText, i18n.language === lang.code && styles.itemActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { padding: theme.spacing.sm },
  triggerText: { color: theme.colors.gold.primary, fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menu: {
    backgroundColor: theme.colors.bg.elevated, borderRadius: theme.radius.lg,
    padding: theme.spacing.sm, minWidth: 160,
    borderWidth: 1, borderColor: theme.colors.glass.border,
  },
  item: { paddingVertical: 12, paddingHorizontal: theme.spacing.md },
  itemText: { fontSize: 16, color: theme.colors.text.primary },
  itemActive: { color: theme.colors.gold.primary, fontWeight: '700' },
});
