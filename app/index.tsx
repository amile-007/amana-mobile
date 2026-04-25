import { View, Text } from 'react-native'

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, color: '#C0392B', fontWeight: 'bold' }}>AMANA</Text>
      <Text style={{ color: '#666', marginTop: 8 }}>Expo Router OK</Text>
    </View>
  )
}
