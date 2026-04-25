import * as Location from 'expo-location'
import { supabase } from '@/lib/supabase'

export const LOCATION_TASK = 'amana-location-task'

// defineTask doit être appelé au niveau module dans le fichier racine
// On l'exporte pour que le fichier racine (_layout.tsx) puisse l'enregistrer
export function getTaskHandler() {
  return async ({ data, error }: any) => {
    if (error) { console.error('[GPS]', error.message); return }
    if (!data) return

    const { locations } = data as { locations: Location.LocationObject[] }
    const loc = locations[0]
    if (!loc) return

    try {
      // RG-GPS-001 : suspension automatique si batterie < 15%
      const Battery = await import('expo-battery')
      const level = await Battery.getBatteryLevelAsync()
      const batterie_pct = Math.round(level * 100)

      if (batterie_pct < 15) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => null)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('positions_collecteurs').upsert(
        {
          collecteur_id: user.id,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          batterie_pct,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'collecteur_id' }
      )
    } catch (e) {
      console.error('[GPS task]', e)
    }
  }
}

export async function startGpsTracking(): Promise<boolean> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync()
    if (status !== 'granted') {
      console.warn('[GPS] Permission arrière-plan refusée')
      return false
    }

    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
    if (alreadyRunning) return true

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 120000,
      distanceInterval: 50,
      foregroundService: {
        notificationTitle: 'AMANA Collecte',
        notificationBody: 'Suivi GPS actif pour vos missions',
        notificationColor: '#C0392B',
      },
      showsBackgroundLocationIndicator: true,
    })
    return true
  } catch (e) {
    console.error('[GPS] startGpsTracking failed:', e)
    return false
  }
}

export async function stopGpsTracking(): Promise<void> {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => null)
}
