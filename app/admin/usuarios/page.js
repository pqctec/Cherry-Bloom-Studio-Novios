import { createServerSupabaseClient } from '@/lib/supabase/server'
import UsuariosAdmin from './UsuariosAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminUsuariosPage() {
  const supabase = await createServerSupabaseClient()
  const [{ data: usuarios, error }, { data: admins }, { data: { user } }] = await Promise.all([
    supabase.rpc('admin_usuarios'),
    supabase.rpc('admin_lista_admins'),
    supabase.auth.getUser(),
  ])
  return <UsuariosAdmin usuarios={usuarios || []} admins={admins || []} miId={user?.id} error={error?.message || null} />
}
