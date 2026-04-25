import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { AuthProvider, useAuth } from '@/context/AuthContext'

function RootNavigator() {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!session) router.replace('/(auth)/login')
    else router.replace('/(tabs)/dashboard')
  }, [session, loading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="mission/[id]"
        options={{ presentation: 'card', headerShown: true, title: 'Mission' }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
