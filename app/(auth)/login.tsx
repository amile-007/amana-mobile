import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { startGpsTracking } from '@/tasks/locationTask'


export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      Alert.alert('Erreur de connexion', 'Email ou mot de passe incorrect.')
    } else {
      await startGpsTracking()
      router.replace('/(tabs)/dashboard')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>AMANA</Text>
        <Text style={styles.subtitle}>Application Collecteur</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  inner:           { flex: 1, justifyContent: 'center', padding: 24 },
  logo:            { fontSize: 36, fontWeight: '800', color: '#C0392B', textAlign: 'center', marginBottom: 4 },
  subtitle:        { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  input:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16, backgroundColor: '#fafafa' },
  button:          { backgroundColor: '#C0392B', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
})
