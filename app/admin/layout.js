import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminShell from './AdminShell'

export const metadata = { title: 'Administración · Cherry Bloom Studio Novios' }

export default async function AdminLayout({ children }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const { data: esAdmin } = await supabase.rpc('es_admin')
  if (!esAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-crema px-6">
        <div className="max-w-sm text-center">
          <p className="font-script text-4xl text-rosa-600">Cherry Bloom Studio</p>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-cacao">Acceso restringido</h1>
          <p className="mt-2 text-sm text-cacao-700">
            La cuenta <b>{user.email}</b> no tiene permisos de administrador.
          </p>
          <a href="/" className="btn-primario btn-sm mt-6">
            Volver al inicio
          </a>
        </div>
      </main>
    )
  }

  const { count: nuevas } = await supabase
    .from('decor_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'nueva')

  const { data: miBoda } = await supabase.from('couples').select('slug').eq('user_id', user.id).maybeSingle()

  return (
    <AdminShell email={user.email} solicitudesNuevas={nuevas || 0} miBoda={miBoda?.slug || null}>
      {children}
    </AdminShell>
  )
}
