import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Icon from '@/components/Icon'
import Ornamento from '@/components/Ornamento'
import { escenario } from '@/lib/escenarios'
import Countdown from './Countdown'
import Invitado from './Invitado'
import { fechaLimite } from '@/lib/invitaciones'

async function cargarPareja(slug) {
  const supabase = await createServerSupabaseClient()
  const { data: couple } = await supabase
    .from('couples')
    .select('id, slug, groom_name, bride_name, wedding_date, venue, cover_message, cover_theme, rsvp_deadline_days')
    .eq('slug', slug)
    .maybeSingle()
  return { supabase, couple }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const { couple } = await cargarPareja(slug)
  if (!couple) return { title: 'Boda no encontrada' }
  return {
    title: `${couple.bride_name} & ${couple.groom_name} · Nuestra boda`,
    description: 'Confirma tu asistencia y elige tu regalo.',
  }
}

export default async function WeddingPage({ params, searchParams }) {
  const { slug } = await params
  const { i: codigo } = (await searchParams) || {}
  const { supabase, couple } = await cargarPareja(slug)
  if (!couple) notFound()

  const [{ data: giftItems }, { data: invitacion }] = await Promise.all([
    supabase
      .from('gift_items')
      .select('id, type, title, description, price, target_amount, collected_amount, status, image_url, quantity, units_reserved, shared')
      .eq('couple_id', couple.id)
      .order('type', { ascending: true })
      .order('created_at', { ascending: true }),
    codigo ? supabase.rpc('ver_invitacion', { p_slug: slug, p_code: codigo }) : Promise.resolve({ data: null }),
  ])

  const portada = escenario(couple.cover_theme)
  const limite = fechaLimite(couple.wedding_date, couple.rsvp_deadline_days)
  const limiteISO = limite ? limite.toISOString().slice(0, 10) : null
  const fecha = couple.wedding_date
    ? new Date(couple.wedding_date + 'T00:00:00').toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <main className="min-h-screen">
      {/* Portada */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden text-center">
        <img src={portada.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-cacao/50 via-cacao/35 to-cacao/75" />
        <div className="relative px-6 py-32 text-white">
          {invitacion ? (
            <span className="font-serif text-xl italic text-rubor sm:text-2xl">Querida(o) {invitacion.name}</span>
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-white/80">Nos casamos</span>
          )}
          <h1 className="mt-6 font-script text-6xl leading-tight sm:text-8xl">
            {couple.bride_name}
            <span className="mx-3 font-serif text-4xl italic text-rubor sm:text-6xl">&amp;</span>
            {couple.groom_name}
          </h1>
          <Ornamento className="mt-6 text-rubor" />
          {(fecha || couple.venue) && (
            <div className="mt-6 flex flex-col items-center gap-2 font-serif text-xl sm:flex-row sm:justify-center sm:gap-6 sm:text-2xl">
              {fecha && (
                <span className="flex items-center gap-2">
                  <Icon name="calendar" className="h-5 w-5 text-rubor" /> {fecha}
                </span>
              )}
              {couple.venue && (
                <span className="flex items-center gap-2">
                  <Icon name="pin" className="h-5 w-5 text-rubor" /> {couple.venue}
                </span>
              )}
            </div>
          )}
          {invitacion && (
            <p className="mx-auto mt-6 inline-block rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm backdrop-blur-md">
              Hemos reservado <b>{invitacion.passes}</b> {invitacion.passes === 1 ? 'lugar' : 'lugares'} para ustedes
            </p>
          )}
          <div className="mt-8">
            <Countdown weddingDate={couple.wedding_date} />
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {invitacion && (
              <a href="#confirmar" className="btn-primario">
                {invitacion.status === 'pendiente' ? 'Confirmar asistencia' : 'Ver mi confirmación'}
              </a>
            )}
            {(giftItems || []).length > 0 && (
              <a href="#regalos" className={invitacion ? 'btn border border-white/50 text-white hover:bg-white/10' : 'btn-primario'}>
                Ver lista de regalos
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Mensaje */}
      {couple.cover_message && (
        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <Icon name="rings" className="mx-auto h-9 w-9 text-oro" />
          <p className="mt-6 whitespace-pre-line font-serif text-2xl italic leading-relaxed text-cacao-700 sm:text-3xl">
            “{couple.cover_message}”
          </p>
          <p className="mt-6 font-script text-3xl text-rosa-600">
            {couple.bride_name} &amp; {couple.groom_name}
          </p>
        </section>
      )}

      <Invitado slug={slug} fechaLimite={limiteISO} codigo={codigo || null} invitacionInicial={invitacion || null} codigoInvalido={!!codigo && !invitacion} regalos={giftItems || []} />

      <section className="pb-20 pt-4 text-center">
        <p className="font-script text-4xl text-rosa-600">¡Te esperamos!</p>
      </section>
    </main>
  )
}
