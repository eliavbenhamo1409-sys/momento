import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function initClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — using a no-op offline client; set env to connect Supabase.',
    )
    return createClient('https://offline.local.supabase.invalid', 'offline-anon-key', {
      auth: { persistSession: false },
    })
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export const supabase = initClient()

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from('album-photos').getPublicUrl(path)
  return data.publicUrl
}
