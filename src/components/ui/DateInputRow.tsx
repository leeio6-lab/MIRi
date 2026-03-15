import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { theme } from '../../constants/theme';

interface DateInputRowProps {
  year: string;
  month: string;
  day: string;
  onChangeYear: (v: string) => void;
  onChangeMonth: (v: string) => void;
  onChangeDay: (v: string) => void;
  /** Style variant: 'card' wraps in white card, 'inline' renders flat */
  variant?: 'card' | 'inline';
}

export function DateInputRow({
  year, month, day,
  onChangeYear, onChangeMonth, onChangeDay,
  variant = 'card',
}: DateInputRowProps) {
  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);

  const handleYearText = (v: string) => {
    onChangeYear(v);
    if (v.length === 4) monthRef.current?.focus();
  };

  const handleMonthText = (v: string) => {
    onChangeMonth(v);
    if (v.length === 2) dayRef.current?.focus();
  };

  const isInline = variant === 'inline';
  const containerStyle = isInline ? styles.inlineContainer : styles.dateCard;

  return (
    <View style={[styles.dateRow, containerStyle]}>
      {/* Year */}
      <View style={styles.inputGroupYear}>
        <TextInput
          style={[styles.input, isInline && styles.inputInline]}
          value={year}
          onChangeText={handleYearText}
          placeholder="1990"
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType="number-pad"
          maxLength={4}
          returnKeyType="next"
        />
        <Text style={styles.hint}>년</Text>
      </View>

      <Text style={styles.sepText}>/</Text>

      {/* Month */}
      <View style={styles.inputGroup}>
        <TextInput
          ref={monthRef}
          style={[styles.input, isInline && styles.inputInline]}
          value={month}
          onChangeText={handleMonthText}
          placeholder="01"
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType="number-pad"
          maxLength={2}
          returnKeyType="next"
        />
        <Text style={styles.hint}>월</Text>
      </View>

      <Text style={styles.sepText}>/</Text>

      {/* Day */}
      <View style={styles.inputGroup}>
        <TextInput
          ref={dayRef}
          style={[styles.input, isInline && styles.inputInline]}
          value={day}
          onChangeText={onChangeDay}
          placeholder="15"
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType="number-pad"
          maxLength={2}
          returnKeyType="done"
        />
        <Text style={styles.hint}>일</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineContainer: {
    backgroundColor: theme.colors.bg.primary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroupYear: { flex: 2, alignItems: 'center' },
  inputGroup: { flex: 1, alignItems: 'center' },
  input: {
    width: '100%',
    paddingVertical: 12,
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '300',
    textAlign: 'center',
  },
  inputInline: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 10,
  },
  hint: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 4,
  },
  sepText: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
    fontWeight: '300',
  },
});
