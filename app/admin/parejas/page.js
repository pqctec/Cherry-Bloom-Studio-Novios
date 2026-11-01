import { createServerSupabaseClient } from '@/lib/supabase/server'
import ParejasAdmin from './ParejasAdmin'

export default async function AdminParejasPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('admin_parejas')
  // Modelo de invitación elegido y estado del PRO de cada pareja.
  const [{ data: modelos }, { data: pros }] = await Promise.all([
    supabase.from('couples').select('id, event_type, invite->modelo'),
    supabase.from('couple_pro').select('couple_id, requested_at, unlocked_at'),
  ])
  const extra = {}
  for (const m of modelos || []) extra[m.id] = { modelo: m.modelo || null, event_type: m.event_type || 'boda' }
  for (const p of pros || []) extra[p.couple_id] = { ...(extra[p.couple_id] || {}), pro_solicitado: p.requested_at, pro_activo: p.unlocked_at }
  return <ParejasAdmin parejas={(data || []).map((p) => ({ ...p, ...(extra[p.id] || {}) }))} />
}
