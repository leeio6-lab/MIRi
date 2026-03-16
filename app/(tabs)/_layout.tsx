import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../src/constants/theme';

function TabIcon({ label, focused, char }: { label: string; focused: boolean; char: string }) {
  return (
    <View style={styles.tabIcon} accessibilityLabel={label} accessibilityRole="tab">
      <Text style={[styles.tabChar, focused && styles.tabCharActive]} aria-hidden>{char}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#1C1C1E',
        tabBarInactiveTintColor: '#AEAEB2',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarAccessibilityLabel: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t('tabs.home')} focused={focused} char="占" />
          ),
        }}
      />
      <Tabs.Screen
        name="saju"
        options={{
          tabBarAccessibilityLabel: t('tabs.saju'),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t('tabs.saju')} focused={focused} char="命" />
          ),
        }}
      />
      <Tabs.Screen
        name="compatibility"
        options={{
          tabBarAccessibilityLabel: t('tabs.compatibility'),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t('tabs.compatibility')} focused={focused} char="緣" />
          ),
        }}
      />
      <Tabs.Screen
        name="face"
        options={{
          tabBarAccessibilityLabel: t('tabs.face'),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t('tabs.face')} focused={focused} char="相" />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          tabBarAccessibilityLabel: t('tabs.mypage'),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t('tabs.mypage')} focused={focused} char="我" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderTopWidth: 1,
    height: 84,
    paddingBottom: 34,
    paddingTop: 8,
  },
  tabIcon: {
    alignItems: 'center',
    gap: 2,
  },
  tabChar: {
    fontSize: 22,
    fontWeight: '600',
    color: '#AEAEB2',
  },
  tabCharActive: {
    color: '#1C1C1E',
  },
  tabLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  tabLabelActive: {
    color: theme.colors.gold.primary,
    fontWeight: '600',
  },
});
