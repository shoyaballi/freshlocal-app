import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function VendorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="signup" />
    </Stack>
  );
}
