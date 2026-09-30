'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { linkWhatsApp } from '@/lib/escenarios'

const ESTADO = {
  nueva: { label: 'Enviada', clase: 'bg-arena text-cacao-700' },
  cotizada: { label: 'Cotización enviada', clase: 'bg-oro-100 text-oro' },
  aceptada: { label: 'Aceptada', clase: 'bg-salvia-100 text-salvia' },
  descartada: { label: 'Descartada', clase: 'bg-rubor-100 text-terracota-700' },
}

export default function Cotizador({ couple, servicios, solicitudes, personasConfirmadas }) {
  const router = useRouter()
  const supabase = createClient()
  const [elegidos, setElegidos] = useState(() => new Set())
  const [invitados, setInvitados] = useState(personasConfirmadas || '')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(null)
  const [error, setError] = useState(null)

  const categorias = [...new Set(servicios.map((s) => s.category))]

  function alternar(id) {
    setEnviado(null)
    setElegidos((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function enviar(e) {
    e.preventDefault()
    if (elegidos.size === 0) return
    setEnviando(true)
    setError(null)

    const titulos = servicios.filter((s) => elegidos.has(s.id)).map((s) => s.title)
    const { error: insertError } = await supabase.from('decor_requests').insert({
      couple_id: couple.id,
      services: titulos,
      guests_estimate: invitados ? Number(invitados) : null,
      contact_phone: telefono.trim() || null,
      notes: notas.trim() || null,
    })

    setEnviando(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    // Al pedir cotización, el paso de decoración queda como "Sí".
    if (couple.decor_interest !== 'si') await supabase.from('couples').update({ decor_interest: 'si' }).eq('id', couple.id)

    const fecha = couple.wedding_date
      ? new Date(couple.wedding_date + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'por definir'
    const mensaje = [
      `¡Hola Cherry Bloom Studio! Somos ${couple.bride_name} y ${couple.groom_name} y queremos cotizar la decoración de nuestra boda.`,
      `📅 Fecha: ${fecha}`,
      `📍 Lugar: ${couple.venue || 'por definir'}`,
      `👥 Invitados aprox.: ${invitados || 'por definir'}`,
      '',
      'Nos interesa:',
      ...titulos.map((t) => `• ${t}`),
      notas.trim() ? `\nNotas: ${notas.trim()}` : '',
    ].join('\n')

    setEnviado(linkWhatsApp(mensaje))
    setElegidos(new Set())
    router.refresh()
  }

  return (
    <div className="space-y-10">
      {couple.decor_interest === 'no' && (
        <div className="rounded-2xl border border-oro-300 bg-oro-100 px-5 py-4 text-sm text-cacao">
          En su preparación indicaron que <b>por ahora no</b> desean decoración. Si cambiaron de idea, marquen lo que les
          interesa y envíen la solicitud: el paso se actualizará solo.
        </div>
      )}
      {categorias.map((cat) => (
        <section key={cat}>
          <h2 className="mb-4 font-script text-4xl text-terracota">{cat}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {servicios
              .filter((s) => s.category === cat)
              .map((s) => {
                const activo = elegidos.has(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => alternar(s.id)}
                    className={`tarjeta flex flex-col overflow-hidden text-left transition ${
                      activo ? 'ring-2 ring-terracota ring-offset-2 ring-offset-crema' : 'hover:shadow-suave'
                    }`}
                  >
                    <div className="relative">
                      <img src={s.image_url} alt={s.title} className="h-40 w-full object-cover" loading="lazy" />
                      <span
                        className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white ${
                          activo ? 'bg-terracota text-white' : 'bg-white/60 text-transparent'
                        }`}
                      >
                        <Icon name="check" className="h-4 w-4" />
                      </span>
                      <span className="absolute left-3 top-3 rounded-full bg-crema/90 px-2.5 py-0.5 text-[11px] font-medium text-terracota">
                        {s.price_label}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg font-semibold leading-snug text-cacao">{s.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-cacao-500">{s.description}</p>
                    </div>
                  </button>
                )
              })}
          </div>
        </section>
      ))}

      <form onSubmit={enviar} className="tarjeta sticky bottom-4 z-10 space-y-4 p-5 shadow-suave">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold">
            Solicitar cotización{' '}
            <span className="text-base font-normal text-cacao-500">
              ({elegidos.size} {elegidos.size === 1 ? 'elemento' : 'elementos'})
            </span>
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="etiqueta">Invitados aproximados</label>
            <input type="number" min="1" value={invitados} onChange={(e) => setInvitados(e.target.value)} className="campo" placeholder="120" />
          </div>
          <div>
            <label className="etiqueta">Su WhatsApp</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="campo" placeholder="9XX XXX XXX" />
          </div>
          <div>
            <label className="etiqueta">Estilo o ideas (opcional)</label>
            <input value={notas} onChange={(e) => setNotas(e.target.value)} className="campo" placeholder="Boho, tonos terracota, en jardín…" />
          </div>
        </div>
        {error && <p className="text-sm text-terracota-800">{error}</p>}
        {enviado ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-salvia-100 p-4">
            <p className="flex-1 text-sm text-cacao">
              ¡Listo! Recibimos su solicitud. Para una respuesta más rápida, envíennos el resumen por WhatsApp.
            </p>
            <a href={enviado} target="_blank" rel="noreferrer" className="btn-primario btn-sm">
              <Icon name="chat" className="h-4 w-4" /> Enviar por WhatsApp
            </a>
          </div>
        ) : (
          <button type="submit" disabled={enviando || elegidos.size === 0} className="btn-primario">
            {enviando ? 'Enviando…' : elegidos.size === 0 ? 'Marquen lo que les interesa' : 'Enviar solicitud'}
          </button>
        )}
      </form>

      {solicitudes.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-2xl font-semibold">Solicitudes enviadas</h2>
          <div className="space-y-3">
            {solicitudes.map((s) => {
              const estado = ESTADO[s.status] || ESTADO.nueva
              return (
                <div key={s.id} className="tarjeta flex flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-xs text-cacao-500">
                      {new Date(s.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="mt-1 text-sm text-cacao">{s.services.join(' · ')}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}>{estado.label}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
