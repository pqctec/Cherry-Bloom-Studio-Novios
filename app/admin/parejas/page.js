import { createServerSupabaseClient } from '@/lib/supabase/server'
import ParejasAdmin from './ParejasAdmin'

export default async function AdminParejasPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('admin_parejas')
  return <ParejasAdmin parejas={data || []} />
}
