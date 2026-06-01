import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
