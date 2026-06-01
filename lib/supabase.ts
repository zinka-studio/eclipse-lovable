import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

// Guard against missing env vars so the app doesn't crash on load
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as ReturnType<typeof createClient>

export type SiteContent = {
  id: string
  section: string
  key: string
  value: string | null
  updated_at: string
}

export type MenuItem = {
  id: string
  category: string
  name: string
  description: string | null
  price: number | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type Reservation = {
  id: string
  full_name: string
  email: string
  date: string
  guests: number
  special_requests: string | null
  status: 'new' | 'confirmed' | 'cancelled'
  created_at: string
}
