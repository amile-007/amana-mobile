import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import * as Location from 'expo-location'
import { LOCATION_TASK, stopGpsTracking } from '@/tasks/locationTask'

type Profile = { nom: string; prenom: string; telephone: string | null; ville: string | null }

export default function ProfilScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [statut, setStatut] = useState<string>('disponible')
  const [gpsActif, setGpsActif] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase
        .from('profiles').select('nom, prenom, telephone, ville').eq('id', user.id).single()
      setProfile(p)

      const { data: c } = await supabase
        .from('collecteurs').select('statut').eq('id', user.id).single()
      setStatut(c?.statut ?? 'disponible')

      const active = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
      setGpsActif(active)
    }
    load()
  }, [])

  async function toggleStatut() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newStatut = statut === 'disponible' ? 'absent' : 'disponible'
    await supabase.from('collecteurs').update({ statut: newStatut }).eq('id', user.id)
    setStatut(newStatut)
  }

  async function handleLogout() {
    await stopGpsTracking()
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  return (
    <View style={styles.container}>
      {profile && (
        <View style={styles.card}>
          <Text style={styles.name}>{profile.prenom} {profile.nom}</Text>
          {profile.ville     && <Text style={styles.info}>{profile.ville}</Text>}
          {profile.telephone && <Text style={styles.info}>{profile.telephone}</Text>}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Statut</Text>
        <TouchableOpacity
          style={[styles.statutBtn, statut === 'absent' && styles.statutAbsent]}
          onPress={toggleStatut}
        >
          <Text style={styles.statutText}>
            {statut === 'disponible' ? 'Disponible' : 'Absent'}
          </Text>
          <Text style={styles.statutHint}>Appuyer pour changer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>GPS tracking</Text>
        <Text style={styles.info}>{gpsActif ? 'Actif (arrière-plan)' : 'Inactif'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F3F4F6', padding: 16, gap: 12 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  name:         { fontSize: 20, fontWeight: '700', color: '#111827' },
  info:         { fontSize: 14, color: '#6B7280', marginTop: 4 },
  label:        { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 },
  statutBtn:    { backgroundColor: '#ECFDF5', borderRadius: 8, padding: 12 },
  statutAbsent: { backgroundColor: '#FEF2F2' },
  statutText:   { fontSize: 16, fontWeight: '600', color: '#111827' },
  statutHint:   { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  logoutBtn:    { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8 },
  logoutText:   { fontSize: 16, color: '#C0392B', fontWeight: '600' },
})
