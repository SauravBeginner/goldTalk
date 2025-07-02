import { Stack } from 'expo-router';
import React from 'react';

export default function RoutesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="onboarding/index"
        options={{
          title: 'Onboarding',
        }}
      />
      <Stack.Screen
        name="record/index"
        options={{
          title: 'Record',
        }}
      />
      {/* Add other screens in this stack here */}
    </Stack>
  );
}