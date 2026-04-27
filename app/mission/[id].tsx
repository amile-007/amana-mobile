import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as Location from 'expo-location'
import { supabase } from '@/lib/supabase'
import { MissionMessages } from '@/components/MissionMessages'

type Colis = {
  id: string
  destinataire_nom: string
  destinataire_telephone: string
  destinataire_adresse: string | null
  destination_ville: string | null
  poids_declare: number
}

type Demande = {
  id: string
  statut: string
  ville: string
  adresse_collecte_texte: string
  notes: string | null
  creneau_souhaite: string | null
  colis_amana: Colis[]
}

export default function MissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [collecteurId, setCollecteurId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCollecteurId(user?.id ?? null))
    supabase
      .from('demandes')
      .select('id, statut, ville, adresse_collecte_texte, notes, creneau_souhaite, colis_amana(id, destinataire_nom, destinataire_telephone, destinataire_adresse, destination_ville, poids_declare)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setDemande(data as Demande)
        setLoading(false)
      })
  }, [id])

  async function confirmerCollecte() {
    if (!demande) return

    Alert.alert(
      'Confirmer la collecte',
      'Avez-vous bien collecté le(s) colis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setConfirming(true)

            const { status } = await Location.requestForegroundPermissionsAsync()
            let lat: number | null = null
            let lng: number | null = null
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
              lat = loc.coords.latitude
              lng = loc.coords.longitude
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setConfirming(false); return }

            const { error } = await supabase
              .from('demandes')
              .update({ statut: 'collectee' })
              .eq('id', demande.id)

            if (error) {
              Alert.alert('Erreur', 'Impossible de confirmer la collecte.')
              setConfirming(false)
              return
            }

            if (lat !== null && lng !== null) {
              await supabase.from('positions_collecteurs').upsert(
                { collecteur_id: user.id, lat, lng, updated_at: new Date().toISOString() },
                { onConflict: 'collecteur_id' }
              )
            }

            await supabase.from('collecteurs').update({ statut: 'disponible' }).eq('id', user.id)

            setConfirming(false)
            Alert.alert('Collecte confirmée !', '', [
              { text: 'OK', onPress: () => router.back() },
            ])
          },
        },
      ]
    )
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#C0392B" /></View>
  if (!demande) return <View style={styles.center}><Text>Mission introuvable</Text></View>

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Adresse de collecte</Text>
        <Text style={styles.adresse}>{demande.adresse_collecte_texte}</Text>
        <Text style={styles.ville}>{demande.ville}</Text>
        {demande.creneau_souhaite && <Text style={styles.detail}>Créneau : {demande.creneau_souhaite}</Text>}
        {demande.notes           && <Text style={styles.detail}>Instructions : {demande.notes}</Text>}
      </View>

      {demande.colis_amana.map((c, i) => (
        <View key={c.id} style={styles.section}>
          <Text style={styles.sectionLabel}>Colis {i + 1}</Text>
          <Text style={styles.colisNom}>{c.destinataire_nom}</Text>
          <Text style={styles.detail}>{c.destinataire_telephone}</Text>
          {c.destination_ville   && <Text style={styles.detail}>Destination : {c.destination_ville}</Text>}
          {c.destinataire_adresse && <Text style={styles.detail}>{c.destinataire_adresse}</Text>}
          <Text style={styles.poids}>{c.poids_declare} kg</Text>
        </View>
      ))}

      {demande.statut !== 'collectee' ? (
        <TouchableOpacity
          style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
          onPress={confirmerCollecte}
          disabled={confirming}
        >
          <Text style={styles.confirmText}>
            {confirming ? 'Confirmation...' : 'Confirmer la collecte'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneBanner}>
          <Text style={styles.doneText}>Collecte confirmée</Text>
        </View>
      )}

      <MissionMessages demandeId={id} collecteurId={collecteurId} />

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F3F4F6' },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section:            { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sectionLabel:       { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 },
  adresse:            { fontSize: 15, color: '#111827', lineHeight: 22 },
  ville:              { fontSize: 13, color: '#6B7280', marginTop: 4 },
  detail:             { fontSize: 13, color: '#6B7280', marginTop: 4 },
  colisNom:           { fontSize: 16, fontWeight: '600', color: '#111827' },
  poids:              { fontSize: 14, color: '#C0392B', fontWeight: '600', marginTop: 8 },
  confirmBtn:         { margin: 16, marginTop: 24, backgroundColor: '#C0392B', borderRadius: 12, padding: 18, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText:        { color: '#fff', fontSize: 17, fontWeight: '700' },
  doneBanner:         { margin: 16, marginTop: 24, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 18, alignItems: 'center' },
  doneText:           { color: '#10B981', fontSize: 17, fontWeight: '700' },
})
