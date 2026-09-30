import { createServerSupabaseClient } from '@/lib/supabase/server'
import CatalogoAdmin from './CatalogoAdmin'

export default async function AdminRegalosPage() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('admin_catalogo')
  return <CatalogoAdmin productos={data || []} error={error?.message} />
}
