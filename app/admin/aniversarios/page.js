import { createServerSupabaseClient } from '@/lib/supabase/server'
import AniversariosAdmin from './AniversariosAdmin'

export default async function AdminAniversariosPage() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('admin_aniversarios')
  return <AniversariosAdmin clientes={data || []} error={error?.message} />
}
