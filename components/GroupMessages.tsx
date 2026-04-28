import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase'

interface GroupMessage {
  id: string
  created_at: string
  texte: string
  expediteur?: { prenom: string | null; nom: string | null }
}

interface Props {
  centreId: string | null
}

export function GroupMessages({ centreId }: Props) {
  const [messages, setMessages] = useState<GroupMessage[]>([])

  useEffect(() => {
    if (!centreId) return

    supabase
      .from('messages')
      .select('id, created_at, texte, expediteur:profiles!expediteur_id(prenom, nom)')
      .eq('centre_id', centreId)
      .is('demande_id', null)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setMessages((data ?? []) as GroupMessage[]))

    const channel = supabase
      .channel(`group-messages:${centreId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `centre_id=eq.${centreId}`,
      }, payload => {
        const msg = payload.new as GroupMessage
        if ((payload.new as any).demande_id === null) {
          setMessages(prev => [msg, ...prev].slice(0, 5))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [centreId])

  if (!messages.length) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Annonces du chef de centre</Text>
      {messages.map(m => (
        <View key={m.id} style={styles.item}>
          <View style={styles.dot} />
          <View style={styles.content}>
            <Text style={styles.text}>{m.texte}</Text>
            <Text style={styles.meta}>
              {m.expediteur?.prenom} {m.expediteur?.nom} ·{' '}
              {new Date(m.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  title:      { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  item:       { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  dot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8491E', marginTop: 5, flexShrink: 0 },
  content:    { flex: 1 },
  text:       { fontSize: 13, color: '#111827', lineHeight: 18 },
  meta:       { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
})
