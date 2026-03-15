import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { DateInputRow } from '../ui/DateInputRow';

interface BirthFormProps {
  onSubmit: (data: {
    year: number;
    month: number;
    day: number;
    hour: number;
    isLunar: boolean;
    gender: 'male' | 'female';
  }) => void;
  submitLabel?: string;
}

export function BirthForm({ onSubmit, submitLabel }: BirthFormProps) {
  const { t } = useTranslation();
  const resolvedSubmitLabel = submitLabel ?? t('common.analyzing');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('12');
  const [isLunar, setIsLunar] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const handleSubmit = () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const h = parseInt(hour, 10);
    if (y && m && d) {
      onSubmit({ year: y, month: m, day: d, hour: h, isLunar, gender });
    }
  };

  const isValid = year.length === 4 && month.length >= 1 && day.length >= 1;

  return (
    <GlassCard style={styles.container}>
      <DateInputRow
        year={year}
        month={month}
        day={day}
        onChangeYear={setYear}
        onChangeMonth={setMonth}
        onChangeDay={setDay}
        variant="inline"
      />

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggle, gender === 'male' && styles.toggleActive]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.toggleText, gender === 'male' && styles.toggleTextActive]}>남성</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, gender === 'female' && styles.toggleActive]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.toggleText, gender === 'female' && styles.toggleTextActive]}>여성</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, !isValid && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!isValid}
      >
        <Text style={styles.submitText}>{resolvedSubmitLabel}</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {},
  toggleRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  toggle: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    backgroundColor: theme.colors.bg.primary, borderRadius: theme.radius.sm,
  },
  toggleActive: { backgroundColor: theme.colors.gold.primary },
  toggleText: { color: theme.colors.text.secondary, fontSize: 14 },
  toggleTextActive: { color: theme.colors.text.inverse, fontWeight: '600' },
  submitBtn: {
    backgroundColor: theme.colors.gold.primary, borderRadius: theme.radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: theme.colors.text.inverse, fontSize: 16, fontWeight: '600' },
});
