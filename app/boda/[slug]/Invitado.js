'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import Ornamento from '@/components/Ornamento'
import GiftCard from './GiftCard'
import { fechaLarga } from '@/lib/invitaciones'

// Avisa a los novios (en segundo plano) que hubo una novedad. Si WhatsApp no
// está configurado en el servidor, no hace nada.
function avisarNovios(slug) {
  fetch('/api/notificar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) }).catch(() => {})
}

// Flujo del invitado con su link personal: 1) confirma asistencia (hasta sus
// pases) y 2) elige su regalo. Sin link personal solo puede ver la lista.
export default function Invitado({ slug, fechaLimite, codigo, invitacionInicial, codigoInvalido, regalos }) {
  const supabase = createClient()
  const [inv, setInv] = useState(invitacionInicial)
  const [editando, setEditando] = useState(!invitacionInicial || invitacionInicial.status === 'pendiente')
  const [asiste, setAsiste] = useState(invitacionInicial?.status !== 'no_asiste')
  const [cantidad, setCantidad] = useState(invitacionInicial?.attending || invitacionInicial?.passes || 1)
  const [nombres, setNombres] = useState(invitacionInicial?.guest_names || '')
  const [mensaje, setMensaje] = useState(invitacionInicial?.message || '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const vencido = fechaLimite ? new Date(new Date().toDateString()) > new Date(fechaLimite + 'T00:00:00') : false
  const fondos = regalos.filter((g) => g.type === 'fondo')
  const productos = regalos.filter((g) => g.type === 'producto')

  async function responder(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('responder_invitacion', {
      p_slug: slug,
      p_code: codigo,
      p_asiste: asiste,
      p_cantidad: asiste ? cantidad : 0,
      p_nombres: asiste ? nombres : null,
      p_mensaje: mensaje,
    })
    setEnviando(false)
    if (err) return setError(err.message)
    setInv(data)
    setEditando(false)
    avisarNovios(slug)
    if (asiste && regalos.length) setTimeout(() => document.getElementById('regalos')?.scrollIntoView({ behavior: 'smooth' }), 400)
  }

  function alRegalar(item) {
    avisarNovios(slug)
    setInv((v) => (v ? { ...v, regalos: [...(v.regalos || []), item.title] } : v))
  }

  return (
    <>
      {/* Confirmación */}
      <section id="confirmar" className="bg-arena/60 px-6 py-20">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <span className="eyebrow">Paso 1 · ¿Nos acompañas?</span>
            <h2 className="titulo mt-3 text-4xl">Confirma tu asistencia</h2>
            <Ornamento className="mt-4 text-oro" />
            {fechaLimite && (
              <p className={`mt-4 text-sm ${vencido ? 'text-terracota-800' : 'text-cacao-700'}`}>
                {vencido ? 'El plazo para confirmar terminó el' : 'Confirma antes del'} <b>{fechaLarga(fechaLimite)}</b>
              </p>
            )}
          </div>

          {!codigo || codigoInvalido ? (
            <div className="tarjeta p-8 text-center">
              <Icon name="heart" className="mx-auto h-9 w-9 text-terracota" />
              <p className="mt-4 font-serif text-2xl font-semibold text-cacao">
                {codigoInvalido ? 'No encontramos tu invitación' : 'Confirma desde tu invitación personal'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cacao-700">
                Para confirmar tu asistencia y elegir tu regalo, abre el link personal que te enviaron los novios por
                WhatsApp. Si no lo tienes, pídeselo a ellos.
              </p>
            </div>
          ) : vencido && inv.status === 'pendiente' ? (
            <div className="tarjeta p-8 text-center">
              <Icon name="calendar" className="mx-auto h-9 w-9 text-terracota" />
              <p className="mt-4 font-serif text-2xl font-semibold text-cacao">El plazo para confirmar terminó</p>
              <p className="mt-2 text-sm text-cacao-700">Si aún deseas asistir, comunícate directamente con los novios.</p>
            </div>
          ) : !editando || vencido ? (
            <div className="tarjeta p-8 text-center">
              <Icon name={inv.status === 'confirmado' ? 'heart' : 'calendar'} className="mx-auto h-10 w-10 text-terracota" />
              <p className="mt-4 font-serif text-2xl font-semibold text-cacao">
                {inv.status === 'confirmado' ? '¡Gracias por confirmar!' : 'Gracias por avisarnos'}
              </p>
              <p className="mt-2 text-sm text-cacao-700">
                {inv.status === 'confirmado'
                  ? `Registramos ${inv.attending} ${inv.attending === 1 ? 'asistente' : 'asistentes'} de ${inv.passes} ${inv.passes === 1 ? 'pase' : 'pases'}.`
                  : 'Te vamos a extrañar ese día.'}
              </p>
              {inv.guest_names && <p className="mt-1 text-sm text-cacao-500">{inv.guest_names}</p>}
              {(inv.regalos || []).length > 0 && (
                <p className="mx-auto mt-4 max-w-sm rounded-xl bg-salvia-100 px-4 py-2 text-sm text-salvia">
                  Tu regalo: {inv.regalos.join(', ')}
                </p>
              )}
              {!vencido && (
                <button onClick={() => setEditando(true)} className="btn-claro btn-sm mt-6">
                  Cambiar mi respuesta
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={responder} className="tarjeta space-y-5 p-6">
              <div className="grid grid-cols-2 gap-2">
                {[
                  [true, 'Sí, asistiremos'],
                  [false, 'No podremos ir'],
                ].map(([v, l]) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setAsiste(v)}
                    className={`rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
                      asiste === v ? 'bg-terracota text-crema' : 'border border-arena-300 text-cacao-700 hover:bg-arena'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {asiste && (
                <>
                  <div>
                    <label className="etiqueta">¿Cuántas personas asistirán?</label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: inv.passes }, (_, n) => n + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCantidad(n)}
                          className={`h-11 w-11 rounded-full font-serif text-lg font-semibold transition-colors ${
                            cantidad === n ? 'bg-terracota text-crema' : 'border border-arena-300 bg-white text-cacao hover:bg-arena'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-cacao-500">
                      Tu invitación incluye {inv.passes} {inv.passes === 1 ? 'pase' : 'pases'}.
                    </p>
                  </div>
                  <div>
                    <label className="etiqueta">Nombres de quienes asisten (opcional)</label>
                    <input value={nombres} onChange={(e) => setNombres(e.target.value)} className="campo" placeholder="Juan, Ana…" />
                  </div>
                </>
              )}

              <div>
                <label className="etiqueta">Un mensaje para los novios (opcional)</label>
                <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={2} className="campo" />
              </div>

              {error && <p className="rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{error}</p>}

              <button type="submit" disabled={enviando} className="btn-primario w-full">
                {enviando ? 'Enviando…' : 'Enviar mi respuesta'}
              </button>
              <p className="text-center text-[11px] text-cacao-500">
                Tus datos solo los verán los novios y Cherry Bloom Studio.{' '}
                <a href="/privacidad" target="_blank" className="underline">
                  Privacidad
                </a>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Regalos */}
      {regalos.length > 0 && (
        <section id="regalos" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 text-center">
            <span className="eyebrow">Paso 2 · Lista de regalos</span>
            <h2 className="titulo mt-3 text-4xl sm:text-5xl">Tu presencia es nuestro mejor regalo</h2>
            <Ornamento className="mt-4 text-oro" />
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cacao-700">
              Pero si deseas hacernos un obsequio, aquí elegimos algunas cosas para nuestro nuevo hogar. Cherry
              Bloom Studio se encarga de comprarlo y entregárnoslo.
            </p>
            {!inv && (
              <p className="mx-auto mt-4 max-w-md rounded-full bg-rubor-100 px-4 py-2 text-xs text-terracota-800">
                Para regalar, abre el link personal de tu invitación.
              </p>
            )}
          </div>

          {fondos.length > 0 && (
            <div className="mb-10 grid gap-5 md:grid-cols-2">
              {fondos.map((item) => (
                <GiftCard key={item.id} item={item} slug={slug} codigo={inv ? codigo : null} alRegalar={alRegalar} />
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((item) => (
              <GiftCard key={item.id} item={item} slug={slug} codigo={inv ? codigo : null} alRegalar={alRegalar} />
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-md text-center text-xs text-cacao-500">
            Por ahora no se procesan pagos en línea: al elegir un regalo registras tu intención y coordinamos el
            resto contigo.
          </p>
        </section>
      )}
    </>
  )
}
