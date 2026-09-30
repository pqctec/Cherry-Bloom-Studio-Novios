import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import PanelNav from './PanelNav'
import LogoutButton from './LogoutButton'

export default async function PanelLayout({ children }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // El middleware ya debería haber redirigido, pero lo repetimos acá como
  // segunda capa de seguridad.
  if (!user) redirect('/login')

  const { data: couple } = await supabase
    .from('couples')
    .select('id, slug, groom_name, bride_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!couple) {
    const { data: esAdmin } = await supabase.rpc('es_admin')
    redirect(esAdmin ? '/admin' : '/registro')
  }

  const { count: nuevas } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('couple_id', couple.id)
    .is('read_at', null)

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-8 lg:flex lg:gap-10 lg:py-12">
      <aside className="mb-8 lg:mb-0 lg:w-60 lg:shrink-0">
        <div className="tarjeta p-5 text-center lg:sticky lg:top-24">
          <span className="eyebrow">Nuestra boda</span>
          <p className="mt-2 font-script text-4xl leading-tight text-terracota">
            {couple.bride_name} &amp; {couple.groom_name}
          </p>
          <PanelNav slug={couple.slug} nuevas={nuevas || 0} />
          <div className="mt-4 border-t border-arena-200 pt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
