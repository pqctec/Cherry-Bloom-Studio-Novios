import { createServerSupabaseClient } from '@/lib/supabase/server'
import Croquis from './Croquis'

export default async function CroquisPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase
    .from('couples')
    .select('id, bride_name, groom_name, wedding_date, venue, event_type')
    .eq('user_id', user.id)
    .maybeSingle()

  const [{ data: invitaciones }, guardado] = await Promise.all([
    supabase
      .from('invitations')
      .select('id, name, passes, status, attending')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true }),
    supabase.from('seating_layouts').select('layout').eq('couple_id', couple.id).maybeSingle(),
  ])

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <span className="eyebrow">Salón</span>
        <h1 className="titulo mt-2 text-4xl">Croquis y mesas</h1>
        <p className="mt-2 max-w-2xl text-sm text-cacao-700">
          Dibujen su salón, ubiquen las mesas arrastrándolas y siente a cada invitación en su mesa. Los pases se
          toman de su lista de invitados, así que una familia con 3 pases ocupa 3 sillas.
        </p>
      </div>

      <Croquis
        couple={couple}
        invitaciones={invitaciones || []}
        guardado={guardado?.data?.layout || null}
        tablaFaltante={!!guardado?.error}
      />
    </div>
  )
}
