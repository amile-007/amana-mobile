import { Stack } from 'expo-router'
import * as TaskManager from 'expo-task-manager'
import { LOCATION_TASK, getTaskHandler } from '@/tasks/locationTask'

// Enregistrement de la tâche GPS au niveau module (requis par expo-task-manager)
if (!TaskManager.isTaskDefined(LOCATION_TASK)) {
  TaskManager.defineTask(LOCATION_TASK, getTaskHandler())
}

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="mission/[id]"
        options={{ presentation: 'card', headerShown: true, title: 'Mission' }}
      />
    </Stack>
  )
}
