import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { AuthProvider, useAuth } from '@/context/AuthContext'

function RootNavigator() {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (session) {
      router.replace('/(tabs)/dashboard')
    } else {
      router.replace('/(auth)/login')
    }
  }, [session, loading])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#C0392B" />
      </View>
    )
  }

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
