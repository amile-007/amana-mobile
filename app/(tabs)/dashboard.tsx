import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { GroupMessages } from '@/components/GroupMessages'

type Mission = {
  id: string
  statut: string
  ville: string
  adresse_collecte_texte: string
  created_at: string
  colis_amana: { destinataire_nom: string; poids_declare: number }[]
}

const STATUT_COLOR: Record<string, string> = {
  affectee:  '#3B82F6',
  en_cours:  '#10B981',
  collectee: '#6B7280',
}

export default function DashboardScreen() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [centreId, setCentreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMissions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Récupérer le centre_id du collecteur
    supabase.from('collecteurs').select('centre_id').eq('id', user.id).single()
      .then(({ data: col }) => { if (col?.centre_id) setCentreId(col.centre_id) })

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('demandes')
      .select('id, statut, ville, adresse_collecte_texte, created_at, colis_amana(destinataire_nom, poids_declare)')
      .eq('collecteur_id', user.id)
      .in('statut', ['affectee', 'en_cours'])
      .gte('created_at', today)
      .order('created_at', { ascending: false })

    setMissions((data ?? []) as Mission[])
  }, [])

  useEffect(() => {
    fetchMissions().finally(() => setLoading(false))
  }, [fetchMissions])

  async function onRefresh() {
    setRefreshing(true)
    await fetchMissions()
    setRefreshing(false)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#C0392B" /></View>
  }

  const nbAffectees = missions.filter(m => m.statut === 'affectee').length
  const nbEnCours   = missions.filter(m => m.statut === 'en_cours').length

  return (
    <View style={styles.container}>
      <View style={styles.counters}>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{nbAffectees + nbEnCours}</Text>
          <Text style={styles.counterLabel}>Missions</Text>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{nbEnCours}</Text>
          <Text style={styles.counterLabel}>En cours</Text>
        </View>
      </View>

      <GroupMessages centreId={centreId} />

      <FlatList
        data={missions}
        keyExtractor={m => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C0392B" />}
        contentContainerStyle={missions.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune mission aujourd'hui</Text>}
        renderItem={({ item: m }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/mission/${m.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: STATUT_COLOR[m.statut] ?? '#999' }]}>
                <Text style={styles.badgeText}>
                  {m.statut === 'affectee' ? 'À collecter' : 'En cours'}
                </Text>
              </View>
              <Text style={styles.ville}>{m.ville}</Text>
            </View>
            <Text style={styles.adresse} numberOfLines={2}>{m.adresse_collecte_texte}</Text>
            {m.colis_amana?.[0] && (
              <Text style={styles.colis}>
                {m.colis_amana[0].destinataire_nom} · {m.colis_amana[0].poids_declare} kg
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F3F4F6' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  counters:     { flexDirection: 'row', backgroundColor: '#fff', padding: 16, gap: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  counter:      { alignItems: 'center' },
  counterValue: { fontSize: 28, fontWeight: '700', color: '#C0392B' },
  counterLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  card:         { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge:        { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '600' },
  ville:        { fontSize: 12, color: '#6B7280' },
  adresse:      { fontSize: 14, color: '#111827', lineHeight: 20 },
  colis:        { fontSize: 12, color: '#6B7280', marginTop: 6 },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText:    { fontSize: 15, color: '#9CA3AF' },
})
