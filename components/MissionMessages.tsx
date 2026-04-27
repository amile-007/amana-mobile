import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  created_at: string
  expediteur_id: string
  texte: string
  lu_at: string | null
  expediteur?: { prenom: string | null; nom: string | null; role: string }
}

interface Props {
  demandeId: string
  collecteurId: string | null
}

export function MissionMessages({ demandeId, collecteurId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  if (!collecteurId) return null

  useEffect(() => {
    supabase
      .from('messages')
      .select('*, expediteur:profiles!expediteur_id(prenom, nom, role)')
      .eq('demande_id', demandeId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) setFetchError('Impossible de charger les messages')
        setMessages((data ?? []) as Message[])
        setLoading(false)
      })

    supabase
      .from('messages')
      .update({ lu_at: new Date().toISOString() })
      .eq('demande_id', demandeId)
      .neq('expediteur_id', collecteurId)
      .is('lu_at', null)
      .then(() => {})

    const channel = supabase
      .channel(`messages:${demandeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `demande_id=eq.${demandeId}`,
      }, payload => {
        setMessages(prev =>
          prev.some(m => m.id === (payload.new as Message).id)
            ? prev
            : [...prev, payload.new as Message]
        )
        if ((payload.new as Message).expediteur_id !== collecteurId) {
          supabase.from('messages').update({ lu_at: new Date().toISOString() }).eq('id', payload.new.id).then(() => {})
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [demandeId, collecteurId])

  async function handleSend() {
    const t = texte.trim()
    if (!t || sending) return
    setSending(true)
    setSendError(null)
    setTexte('')
    const { error } = await supabase.from('messages').insert({
      demande_id: demandeId,
      expediteur_id: collecteurId,
      texte: t,
    })
    if (error) { setTexte(t); setSendError('Échec envoi, réessayez') }
    setSending(false)
  }

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <ActivityIndicator color="#C0392B" />
      </View>
    )
  }

  if (fetchError) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <Text style={styles.empty}>{fetchError}</Text>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Messages ({messages.length})</Text>

      {messages.length === 0 && (
        <Text style={styles.empty}>Aucun message pour cette mission</Text>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(m => {
          const isMine = m.expediteur_id === collecteurId
          return (
            <View key={m.id} style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
              {!isMine && (
                <Text style={styles.senderName}>
                  {m.expediteur?.prenom} {m.expediteur?.nom}
                </Text>
              )}
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{m.texte}</Text>
              <Text style={[styles.time, isMine && styles.timeMine]}>
                {new Date(m.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )
        })}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={texte}
          onChangeText={setTexte}
          placeholder="Message..."
          placeholderTextColor="#9CA3AF"
          maxLength={1000}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!texte.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!texte.trim() || sending}
        >
          <Text style={styles.sendBtnText}>{sending ? '...' : '→'}</Text>
        </TouchableOpacity>
      </View>
      {sendError && <Text style={styles.sendError}>{sendError}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  section:        { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sectionTitle:   { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10 },
  empty:          { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  chatArea:       { maxHeight: 240, marginBottom: 8 },
  bubble:         { maxWidth: '80%', borderRadius: 12, padding: 8, marginBottom: 6 },
  bubbleMine:     { backgroundColor: '#C0392B', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  bubbleOther:    { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  senderName:     { fontSize: 11, color: '#6B7280', marginBottom: 2, fontWeight: '600' },
  bubbleText:     { fontSize: 14, color: '#111827' },
  bubbleTextMine: { color: '#fff' },
  time:           { fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: 'right' },
  timeMine:       { color: 'rgba(255,255,255,0.6)' },
  inputRow:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input:          { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#111827' },
  sendBtn:        { backgroundColor: '#C0392B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnDisabled:{ backgroundColor: '#E5E7EB' },
  sendBtnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  sendError:      { fontSize: 12, color: '#C0392B', marginTop: 4, textAlign: 'center' },
})
