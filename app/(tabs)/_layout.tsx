import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#C0392B',
      tabBarInactiveTintColor: '#999',
      headerStyle: { backgroundColor: '#C0392B' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Missions', tabBarLabel: 'Missions' }} />
      <Tabs.Screen name="profil"    options={{ title: 'Mon profil', tabBarLabel: 'Profil' }} />
    </Tabs>
  )
}
