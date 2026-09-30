import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Icon from '@/components/Icon'
import { soles } from '@/lib/escenarios'
import PasoDecoracion from './PasoDecoracion'
import Novedades from './Novedades'
import { fechaLimite, fechaLarga } from '@/lib/invitaciones'

const MENSAJES_LISTO = {
  datos: 'Guardamos los datos de su boda.',
  regalos: 'Su lista de regalos está lista.',
  invitaciones: 'Registraron sus invitaciones.',
  decoracion: 'Recibimos su solicitud de decoración. Les enviaremos su cotización.',
  'decoracion-no': 'Anotado: por ahora sin decoración. Pueden activarla cuando quieran.',
}

export default async function PanelResumenPage({ searchParams }) {
  const { listo } = (await searchParams) || {}
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: couple } = await supabase
    .from('couples')
    .select('id, slug, bride_name, groom_name, wedding_date, venue, decor_interest, rsvp_deadline_days')
    .eq('user_id', user.id)
    .maybeSingle()

  const [{ data: invitaciones }, { data: giftItems }, { count: solicitudesDeco }, { data: avisos }] = await Promise.all([
    supabase.from('invitations').select('passes, status, attending').eq('couple_id', couple.id),
    supabase.from('gift_items').select('type, status, price, collected_amount, quantity, units_reserved, shared').eq('couple_id', couple.id),
    supabase.from('decor_requests').select('id', { count: 'exact', head: true }).eq('couple_id', couple.id),
    supabase
      .from('notifications')
      .select('id, type, title, body, created_at, read_at')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const inv = invitaciones || []
  const pases = inv.reduce((s, i) => s + i.passes, 0)
  const asistentes = inv.filter((i) => i.status === 'confirmado').reduce((s, i) => s + i.attending, 0)
  const respondidas = inv.filter((i) => i.status !== 'pendiente').length
  const sinResponder = inv.filter((i) => i.status === 'pendiente').length
  const limite = fechaLimite(couple.wedding_date, couple.rsvp_deadline_days)
  const diasAlLimite = limite ? Math.ceil((limite - new Date(new Date().toDateString())) / 86400000) : null
  // Recordatorio: desde 10 días antes de la fecha límite, si hay invitaciones sin responder
  const tocaRecordar = sinResponder > 0 && respondidas + sinResponder > 0 && diasAlLimite !== null && diasAlLimite <= 10 && diasAlLimite >= 0
  const productos = (giftItems || []).filter((g) => g.type === 'producto')
  const unidades = productos.reduce((s, g) => s + (g.shared ? 1 : g.quantity || 1), 0)
  const regalados = productos.reduce((s, g) => s + (g.shared ? (Number(g.collected_amount) > 0 ? 1 : 0) : g.units_reserved || 0), 0)
  const recaudado = (giftItems || []).reduce((s, g) => s + Number(g.collected_amount || 0), 0)

  const dias = couple.wedding_date ? Math.ceil((new Date(couple.wedding_date + 'T00:00:00') - new Date()) / 86400000) : null

  const pasos = [
    {
      titulo: 'Completen los datos de la boda',
      detalle: 'Fecha, lugar y fecha límite para confirmar: aparecen en la invitación que reciben sus invitados.',
      hecho: !!(couple.wedding_date && couple.venue),
      href: '/panel/configuracion',
      boton: 'Completar datos',
    },
    {
      titulo: 'Armen su lista de regalos',
      detalle: 'Elijan productos del catálogo o abran un fondo. Sus invitados escogerán de aquí.',
      hecho: (giftItems || []).length > 0,
      extra: (giftItems || []).length ? `${(giftItems || []).length} en la lista` : null,
      href: '/panel/regalos',
      boton: 'Elegir regalos',
    },
    {
      titulo: 'Registren sus invitaciones y pases',
      detalle: 'Cada invitación con su número de pases: nadie podrá confirmar más personas de las que ustedes indiquen.',
      hecho: inv.length > 0,
      extra: inv.length ? `${inv.length} invitaciones · ${pases} pases` : null,
      href: '/panel/invitados',
      boton: 'Agregar invitaciones',
    },
  ]
  // Paso de decoración: se responde Sí/No; con "No" queda terminado.
  const interes = couple.decor_interest ?? null
  const decoHecha = interes === 'no' || (interes === 'si' && (solicitudesDeco || 0) > 0)
  pasos.push({ decoracion: true, titulo: 'Decoración', hecho: decoHecha })
  const listos = pasos.every((p) => p.hecho)
  pasos.push({
    titulo: 'Envíen las invitaciones',
    detalle: listos
      ? 'Envíen a cada invitado su link personal por WhatsApp desde la página de Invitaciones.'
      : 'Se habilita cuando completen los pasos anteriores.',
    hecho: respondidas > 0,
    extra: respondidas ? `${respondidas} ya respondieron` : null,
    href: '/panel/invitados',
    boton: 'Enviar invitaciones',
    bloqueado: !listos,
  })
  const completados = pasos.filter((p) => p.hecho).length

  const cards = [
    { label: 'Asistirán', value: asistentes, sub: `de ${pases} pases entregados` },
    { label: 'Regalos elegidos', value: `${regalados}/${unidades}`, sub: 'unidades de su lista ya elegidas' },
    { label: 'Aportes a sus fondos', value: soles(recaudado), sub: 'suma de aportes registrados' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">Resumen</span>
        <h1 className="titulo mt-2 text-4xl">
          {dias !== null && dias >= 0 ? (
            <>
              Faltan <span className="italic text-terracota">{dias}</span> {dias === 1 ? 'día' : 'días'}
            </>
          ) : (
            'Su gran día'
          )}
        </h1>
        <p className="mt-2 text-sm text-cacao-700">
          {couple.wedding_date
            ? new Date(couple.wedding_date + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Aún no definen la fecha'}
          {couple.venue ? ` · ${couple.venue}` : ''}
        </p>
      </div>

      {listo && MENSAJES_LISTO[listo] && (
        <div className="flex items-center gap-3 rounded-2xl border border-salvia-100 bg-salvia-100/70 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-salvia text-white">
            <Icon name="check" className="h-4 w-4" />
          </span>
          <p className="text-sm text-cacao">
            <b>¡Listo! Paso completado.</b> {MENSAJES_LISTO[listo]}{' '}
            {completados < pasos.length && <span className="text-cacao-700">Continúen con el siguiente paso.</span>}
          </p>
        </div>
      )}

      {tocaRecordar && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oro-300 bg-oro-100 px-5 py-4">
          <p className="text-sm text-cacao">
            <b>
              Faltan {diasAlLimite} {diasAlLimite === 1 ? 'día' : 'días'} para la fecha límite
            </b>{' '}
            ({fechaLarga(limite)}) y {sinResponder} {sinResponder === 1 ? 'invitación no ha respondido' : 'invitaciones no han respondido'}.
          </p>
          <Link href="/panel/invitados?filtro=pendiente" className="btn-primario btn-sm">
            Enviar recordatorios
          </Link>
        </div>
      )}

      <Novedades avisos={avisos || []} />

      {/* Pasos para enviar las invitaciones */}
      <section className="tarjeta p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Preparen sus invitaciones</h2>
            <p className="text-sm text-cacao-700">
              {listos ? '¡Todo listo! Ya pueden enviar sus invitaciones.' : 'Completen estos pasos antes de enviar las invitaciones.'}
            </p>
          </div>
          <span className="text-sm font-medium text-terracota">
            {completados} de {pasos.length}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-arena">
          <div className="h-full rounded-full bg-gradient-to-r from-rosa to-terracota transition-all" style={{ width: `${(completados / pasos.length) * 100}%` }} />
        </div>
        <ol className="mt-6 space-y-3">
          {pasos.map((p, i) =>
            p.decoracion ? (
              <PasoDecoracion key="deco" numero={i + 1} coupleId={couple.id} interes={interes} solicitudes={solicitudesDeco || 0} />
            ) : (
            <li
              key={p.titulo}
              className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
                p.hecho ? 'border-salvia-100 bg-salvia-100/40' : p.bloqueado ? 'border-arena-200 opacity-60' : 'border-rosa/40 bg-rubor-100/40'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold ${
                  p.hecho ? 'bg-salvia text-white' : 'bg-white text-terracota ring-1 ring-rosa/40'
                }`}
              >
                {p.hecho ? <Icon name="check" className="h-4 w-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-cacao">
                  {p.titulo}
                  {p.extra && <span className="ml-2 text-xs font-normal text-cacao-500">· {p.extra}</span>}
                </p>
                <p className="text-xs text-cacao-500">{p.detalle}</p>
              </div>
              {!p.bloqueado && (
                <Link href={p.href} className={p.hecho ? 'btn-claro btn-sm' : 'btn-primario btn-sm'}>
                  {p.hecho ? 'Ver' : p.boton}
                </Link>
              )}
            </li>
            )
          )}
        </ol>
      </section>

      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="tarjeta p-6">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-rosa-600">{card.label}</span>
            <p className="mt-2 font-serif text-4xl font-semibold text-cacao">{card.value}</p>
            <p className="mt-1 text-xs text-cacao-500">{card.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-cacao-500">
        Por ahora, cuando un invitado elige un regalo solo se registra su intención; el pago en línea se
        activará en la siguiente etapa.
      </p>
    </div>
  )
}
