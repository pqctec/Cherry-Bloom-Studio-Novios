import { createServerSupabaseClient } from '@/lib/supabase/server'
import Cotizador from './Cotizador'

export default async function DecoracionPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase
    .from('couples')
    .select('id, bride_name, groom_name, wedding_date, venue, decor_interest')
    .eq('user_id', user.id)
    .maybeSingle()

  const [{ data: servicios }, { data: solicitudes }, { data: guests }] = await Promise.all([
    supabase.from('decor_services').select('id, category, title, description, image_url, price_label').eq('active', true).order('sort_order'),
    supabase
      .from('decor_requests')
      .select('id, services, status, created_at')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false }),
    supabase.from('invitations').select('passes').eq('couple_id', couple.id),
  ])

  // Estimado de invitados = total de pases entregados en sus invitaciones
  const personas = (guests || []).reduce((s, g) => s + (g.passes || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">Decoración</span>
        <h1 className="titulo mt-2 text-4xl">Imaginemos juntos su gran día</h1>
        <p className="mt-2 max-w-2xl text-sm text-cacao-700">
          Marquen todo lo que les gustaría para su boda y envíennos la solicitud. Les respondemos con una
          cotización a la medida (fecha, lugar, número de invitados y estilo).
        </p>
      </div>
      <Cotizador couple={couple} servicios={servicios || []} solicitudes={solicitudes || []} personasConfirmadas={personas} />
    </div>
  )
}
