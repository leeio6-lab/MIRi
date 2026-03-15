import { Stack } from 'expo-router';
import { theme } from '../../src/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg.primary },
        animation: 'slide_from_right',
      }}
    />
  );
}
