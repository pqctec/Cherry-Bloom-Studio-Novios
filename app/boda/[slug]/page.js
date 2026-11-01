import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fechaLimite } from '@/lib/invitaciones'
import { textosEvento } from '@/lib/temas'
import InvitacionPublica from './InvitacionPublica'

const COLUMNAS =
  'id, slug, groom_name, bride_name, wedding_date, venue, cover_message, cover_theme, cover_url, rsvp_deadline_days, event_type, original_wedding_date, gifts_enabled, invite'

async function cargarPareja(slug) {
  const supabase = await createServerSupabaseClient()
  const { data: couple } = await supabase.from('couples').select(COLUMNAS).eq('slug', slug).maybeSingle()
  return { supabase, couple }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const { couple } = await cargarPareja(slug)
  if (!couple) return { title: 'Invitación no encontrada' }
  const t = textosEvento(couple)
  return {
    title: `${couple.bride_name} & ${couple.groom_name} · ${t.nuestro}`,
    description: t.aniversario ? 'Acompáñanos a celebrar nuestro aniversario. Confirma tu asistencia aquí.' : 'Confirma tu asistencia y elige tu regalo.',
  }
}

export default async function InvitacionPage({ params, searchParams }) {
  const { slug } = await params
  const { i: codigo } = (await searchParams) || {}
  const { supabase, couple } = await cargarPareja(slug)
  if (!couple) notFound()

  const [{ data: giftItems }, { data: invitacion }, { data: pro }] = await Promise.all([
    couple.gifts_enabled === false
      ? Promise.resolve({ data: [] })
      : supabase
          .from('gift_items')
          .select('id, type, title, description, price, target_amount, collected_amount, status, image_url, quantity, units_reserved, shared')
          .eq('couple_id', couple.id)
          .order('type', { ascending: true })
          .order('created_at', { ascending: true }),
    codigo ? supabase.rpc('ver_invitacion', { p_slug: slug, p_code: codigo }) : Promise.resolve({ data: null }),
    supabase.from('couple_pro').select('unlocked_at').eq('couple_id', couple.id).maybeSingle(),
  ])

  const limite = fechaLimite(couple.wedding_date, couple.rsvp_deadline_days)

  return (
    <InvitacionPublica
      couple={couple}
      invitacion={invitacion || null}
      regalos={giftItems || []}
      codigo={codigo || null}
      codigoInvalido={!!codigo && !invitacion}
      limiteISO={limite ? limite.toISOString().slice(0, 10) : null}
      slug={slug}
      proActivo={!!pro?.unlocked_at}
    />
  )
}
