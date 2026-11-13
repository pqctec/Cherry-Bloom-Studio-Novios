import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Invitaciones from './Invitaciones'
import TerminarPaso from '@/components/TerminarPaso'

const COLUMNAS = 'id, code, name, passes, phone, status, attending, guest_names, message, responded_at, created_at, reminded_at'

// Columnas que llegan con migraciones posteriores: si aún no se ejecutaron,
// la lista sigue funcionando sin ellas.
async function cargarInvitaciones(supabase, coupleId) {
  for (const extra of [', sent_at, group_sent_at', ', sent_at', '']) {
    const r = await supabase.from('invitations').select(COLUMNAS + extra).eq('couple_id', coupleId).order('created_at', { ascending: true })
    if (!r.error) return r
  }
  return { data: [] }
}

export default async function InvitadosPage({ searchParams }) {
  const { filtro } = (await searchParams) || {}
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase
    .from('couples')
    .select('id, slug, bride_name, groom_name, wedding_date, venue, rsvp_deadline_days, event_type, original_wedding_date, gifts_enabled, invite')
    .eq('user_id', user.id)
    .maybeSingle()

  const [{ data: invitaciones }, { count: regalos }, grupo] = await Promise.all([
    cargarInvitaciones(supabase, couple.id),
    supabase.from('gift_items').select('id', { count: 'exact', head: true }).eq('couple_id', couple.id),
    supabase.from('couple_whatsapp_group').select('link').eq('couple_id', couple.id).maybeSingle(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">Invitaciones</span>
        <h1 className="titulo mt-2 text-4xl">Nuestros invitados</h1>
        <p className="mt-2 max-w-2xl text-sm text-cacao-700">
          Registren cada invitación (una persona, una pareja o una familia) con el número de pases. Cada una
          tiene su link personal: el invitado solo podrá confirmar hasta esa cantidad de personas y desde ahí
          elige su regalo.
        </p>
      </div>

      {!regalos && couple.gifts_enabled !== false && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oro-300 bg-oro-100 px-5 py-4">
          <p className="text-sm text-cacao">
            <b>Antes de enviar las invitaciones</b>, completen su lista de regalos para que sus invitados puedan elegir.
          </p>
          <Link href="/panel/regalos" className="btn-primario btn-sm">
            Ir a la lista de regalos
          </Link>
        </div>
      )}

      <Invitaciones
        couple={couple}
        invitaciones={invitaciones || []}
        filtroInicial={filtro || 'todas'}
        grupoInicial={grupo?.data?.link || ''}
        grupoDisponible={!grupo?.error}
      />

      <TerminarPaso
        paso="invitaciones"
        texto="Terminé de registrar invitaciones"
        deshabilitado={(invitaciones || []).length === 0}
        motivo="Registren al menos una invitación para completar este paso."
      />
    </div>
  )
}
