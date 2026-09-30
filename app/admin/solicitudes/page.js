import { createServerSupabaseClient } from '@/lib/supabase/server'
import SolicitudesAdmin from './SolicitudesAdmin'

export default async function AdminSolicitudesPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('admin_solicitudes')
  return <SolicitudesAdmin solicitudes={data || []} />
}
