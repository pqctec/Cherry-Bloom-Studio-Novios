import { createServerSupabaseClient } from '@/lib/supabase/server'
import UsuariosAdmin from './UsuariosAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminUsuariosPage() {
  const supabase = await createServerSupabaseClient()
  // En orden (no en paralelo): así la sesión se renueva una sola vez y ninguna consulta sale sin permiso.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: usuarios, error } = await supabase.rpc('admin_usuarios')
  const { data: admins, error: errorAdmins } = await supabase.rpc('admin_lista_admins')
  return (
    <UsuariosAdmin
      usuarios={usuarios || []}
      admins={admins || []}
      miId={user?.id}
      error={error?.message || errorAdmins?.message || null}
    />
  )
}
