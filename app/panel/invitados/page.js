import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Invitaciones from './Invitaciones'

export default async function InvitadosPage({ searchParams }) {
  const { filtro } = (await searchParams) || {}
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase
    .from('couples')
    .select('id, slug, bride_name, groom_name, wedding_date, venue, rsvp_deadline_days')
    .eq('user_id', user.id)
    .maybeSingle()

  const [{ data: invitaciones }, { count: regalos }] = await Promise.all([
    supabase
      .from('invitations')
      .select('id, code, name, passes, phone, status, attending, guest_names, message, responded_at, created_at, reminded_at')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true }),
    supabase.from('gift_items').select('id', { count: 'exact', head: true }).eq('couple_id', couple.id),
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

      {!regalos && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oro-300 bg-oro-100 px-5 py-4">
          <p className="text-sm text-cacao">
            <b>Antes de enviar las invitaciones</b>, completen su lista de regalos para que sus invitados puedan elegir.
          </p>
          <Link href="/panel/regalos" className="btn-primario btn-sm">
            Ir a la lista de regalos
          </Link>
        </div>
      )}

      <Invitaciones couple={couple} invitaciones={invitaciones || []} filtroInicial={filtro || 'todas'} />
    </div>
  )
}
