import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL  = 'https://qiuslgxaekojqzasrxzq.supabase.co'
const SUPABASE_ANON = 'sb_publishable_8D4T1urki0dZ6zBAhbn3zw_VWcTzsGH'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
