'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { fechaLarga, fechaLimite, linkInvitacion, linkWhatsAppA, mensajeInvitacion, mensajeRecordatorio } from '@/lib/invitaciones'

const ESTADO = {
  pendiente: { label: 'Sin responder', clase: 'bg-arena text-cacao-700' },
  confirmado: { label: 'Confirmó', clase: 'bg-salvia-100 text-salvia' },
  no_asiste: { label: 'No asistirá', clase: 'bg-rubor-100 text-terracota-700' },
}

// Convierte líneas como "Familia Pérez, 3, 987654321" en invitaciones.
function leerLista(texto) {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const partes = l.split(/[,;\t]/).map((p) => p.trim())
      const nombre = partes[0]
      const pases = Math.min(30, Math.max(1, parseInt(partes[1], 10) || 1))
      const telefono = partes[2] || null
      return { name: nombre, passes: pases, phone: telefono }
    })
    .filter((i) => i.name)
}

export default function Invitaciones({ couple, invitaciones, filtroInicial = 'todas' }) {
  const router = useRouter()
  const supabase = createClient()
  const [modo, setModo] = useState('una')
  const [nombre, setNombre] = useState('')
  const [pases, setPases] = useState(2)
  const [telefono, setTelefono] = useState('')
  const [lista, setLista] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState(filtroInicial)
  const [copiado, setCopiado] = useState(null)
  const [editando, setEditando] = useState(null)

  const totalPases = invitaciones.reduce((s, i) => s + i.passes, 0)
  const confirmadas = invitaciones.filter((i) => i.status === 'confirmado')
  const asistentes = confirmadas.reduce((s, i) => s + i.attending, 0)
  const pendientes = invitaciones.filter((i) => i.status === 'pendiente').length
  const visibles = invitaciones.filter((i) => filtro === 'todas' || i.status === filtro)
  const vistaPrevia = leerLista(lista)
  const limite = fechaLimite(couple.wedding_date, couple.rsvp_deadline_days)
  const vencido = limite ? new Date(new Date().toDateString()) > limite : false

  async function agregar(e) {
    e.preventDefault()
    setError(null)
    const filas = modo === 'una' ? [{ name: nombre.trim(), passes: Number(pases), phone: telefono.trim() || null }] : vistaPrevia
    if (!filas.length || !filas[0].name) return setError('Escriban el nombre de la invitación')
    setGuardando(true)
    const { error: err } = await supabase.from('invitations').insert(filas.map((f) => ({ ...f, couple_id: couple.id })))
    setGuardando(false)
    if (err) return setError(err.message)
    setNombre('')
    setTelefono('')
    setLista('')
    router.refresh()
  }

  async function guardarEdicion() {
    const { id, name, passes: p, phone } = editando
    const inv = invitaciones.find((i) => i.id === id)
    if (inv.attending > Number(p)) {
      return setError(`${inv.name} ya confirmó ${inv.attending} personas; no pueden bajar sus pases a menos de eso.`)
    }
    const { error: err } = await supabase
      .from('invitations')
      .update({ name: name.trim(), passes: Number(p), phone: phone?.trim() || null })
      .eq('id', id)
    if (err) return setError(err.message)
    setEditando(null)
    setError(null)
    router.refresh()
  }

  async function eliminar(inv) {
    if (!window.confirm(`¿Eliminar la invitación de ${inv.name}? Su link dejará de funcionar.`)) return
    await supabase.from('invitations').delete().eq('id', inv.id)
    router.refresh()
  }

  async function copiar(inv) {
    try {
      await navigator.clipboard.writeText(linkInvitacion(couple.slug, inv.code))
      setCopiado(inv.id)
      setTimeout(() => setCopiado(null), 2000)
    } catch {}
  }

  async function recordar(inv) {
    const link = linkInvitacion(couple.slug, inv.code)
    window.open(linkWhatsAppA(inv.phone, mensajeRecordatorio({ invitacion: inv, couple, link, limite })), '_blank')
    await supabase.from('invitations').update({ reminded_at: new Date().toISOString() }).eq('id', inv.id)
    router.refresh()
  }

  function enviar(inv) {
    const link = linkInvitacion(couple.slug, inv.code)
    window.open(linkWhatsAppA(inv.phone, mensajeInvitacion({ invitacion: inv, couple, link })), '_blank')
  }

  return (
    <div className="space-y-8">
      {limite && (
        <p className={`rounded-2xl px-5 py-3 text-sm ${vencido ? 'bg-rubor-100 text-terracota-800' : 'bg-crema text-cacao'}`}>
          {vencido ? 'La fecha límite para confirmar ya pasó' : 'Sus invitados pueden confirmar hasta el'}{' '}
          <b>{fechaLarga(limite)}</b>. Pueden cambiarla en “Nuestra página”.
        </p>
      )}
      {/* Totales */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['Invitaciones', invitaciones.length],
          ['Pases entregados', totalPases],
          ['Asistirán', asistentes],
          ['Sin responder', pendientes],
        ].map(([l, v]) => (
          <div key={l} className="tarjeta p-5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-rosa-600">{l}</span>
            <p className="mt-1 font-serif text-4xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {/* Agregar */}
      <form onSubmit={agregar} className="tarjeta space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">Agregar invitaciones</h2>
          <div className="flex rounded-full border border-arena-300 p-0.5 text-xs font-medium">
            {[
              ['una', 'Una por una'],
              ['lista', 'Pegar una lista'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setModo(v)}
                className={`rounded-full px-4 py-1.5 ${modo === v ? 'bg-terracota text-crema' : 'text-cacao-700'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {modo === 'una' ? (
          <div className="grid gap-4 sm:grid-cols-[1fr,150px,180px]">
            <div>
              <label className="etiqueta">Nombre en la invitación</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo" placeholder="Familia Pérez / Tía Rosa y Carlos" />
            </div>
            <div>
              <label className="etiqueta">Pases</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPases((n) => Math.max(1, n - 1))} className="btn-claro btn-sm h-10 w-10 px-0">
                  −
                </button>
                <span className="w-8 text-center font-serif text-2xl font-semibold">{pases}</span>
                <button type="button" onClick={() => setPases((n) => Math.min(30, n + 1))} className="btn-claro btn-sm h-10 w-10 px-0">
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="etiqueta">WhatsApp (opcional)</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="campo" placeholder="9XX XXX XXX" />
            </div>
          </div>
        ) : (
          <div>
            <label className="etiqueta">Una invitación por línea: nombre, pases, WhatsApp (opcional)</label>
            <textarea
              value={lista}
              onChange={(e) => setLista(e.target.value)}
              rows={6}
              className="campo font-mono text-xs"
              placeholder={'Familia Pérez, 4, 987654321\nTía Rosa y Carlos, 2\nMiguel Torres, 1'}
            />
            {vistaPrevia.length > 0 && (
              <p className="mt-2 text-xs text-cacao-500">
                Se agregarán {vistaPrevia.length} invitaciones con {vistaPrevia.reduce((s, i) => s + i.passes, 0)} pases en total.
              </p>
            )}
          </div>
        )}

        {error && <p className="rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{error}</p>}
        <button type="submit" disabled={guardando} className="btn-primario btn-sm">
          <Icon name="plus" className="h-4 w-4" />
          {guardando ? 'Guardando…' : modo === 'una' ? 'Agregar invitación' : `Agregar ${vistaPrevia.length || ''} invitaciones`}
        </button>
      </form>

      {/* Lista */}
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            ['todas', `Todas (${invitaciones.length})`],
            ['pendiente', `Sin responder (${pendientes})`],
            ['confirmado', `Confirmaron (${confirmadas.length})`],
            ['no_asiste', `No asistirán (${invitaciones.filter((i) => i.status === 'no_asiste').length})`],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${filtro === v ? 'bg-terracota text-crema' : 'border border-arena-300 bg-white/70 text-cacao-700'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="tarjeta overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-arena-200 text-left text-[11px] font-medium uppercase tracking-[0.2em] text-cacao-500">
                <th className="px-5 py-3">Invitación</th>
                <th className="px-5 py-3 text-center">Pases</th>
                <th className="px-5 py-3">Respuesta</th>
                <th className="px-5 py-3 text-right">Link personal</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-cacao-500">
                    {invitaciones.length === 0 ? 'Aún no registran invitaciones. Agreguen la primera arriba.' : 'No hay invitaciones en esta vista.'}
                  </td>
                </tr>
              )}
              {visibles.map((inv) => {
                const estado = ESTADO[inv.status]
                const enEdicion = editando?.id === inv.id
                return (
                  <tr key={inv.id} className="border-b border-arena-200/70 align-top last:border-0">
                    <td className="px-5 py-3">
                      {enEdicion ? (
                        <div className="space-y-2">
                          <input value={editando.name} onChange={(e) => setEditando({ ...editando, name: e.target.value })} className="campo py-1.5" />
                          <input
                            value={editando.phone || ''}
                            onChange={(e) => setEditando({ ...editando, phone: e.target.value })}
                            className="campo py-1.5"
                            placeholder="WhatsApp"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-cacao">{inv.name}</p>
                          <p className="text-xs text-cacao-500">{inv.phone || 'Sin WhatsApp'}</p>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {enEdicion ? (
                        <input
                          type="number"
                          min={Math.max(1, inv.attending)}
                          max={30}
                          value={editando.passes}
                          onChange={(e) => setEditando({ ...editando, passes: e.target.value })}
                          className="campo w-20 py-1.5 text-center"
                        />
                      ) : (
                        <span className="font-serif text-2xl font-semibold text-cacao">{inv.passes}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}>
                        {estado.label}
                        {inv.status === 'confirmado' ? ` · ${inv.attending} de ${inv.passes}` : ''}
                      </span>
                      {inv.guest_names && <p className="mt-1.5 text-xs text-cacao-700">{inv.guest_names}</p>}
                      {inv.status === 'pendiente' && inv.reminded_at && (
                        <p className="mt-1.5 text-[11px] text-cacao-500">
                          Recordado el {new Date(inv.reminded_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                      {inv.message && <p className="mt-1 text-xs italic text-cacao-500">“{inv.message}”</p>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {enEdicion ? (
                          <>
                            <button onClick={guardarEdicion} className="btn-primario btn-sm px-3">
                              Guardar
                            </button>
                            <button onClick={() => setEditando(null)} className="btn-claro btn-sm px-3">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            {inv.status === 'pendiente' && filtro === 'pendiente' ? (
                              <button onClick={() => recordar(inv)} className="btn-primario btn-sm px-3" title="Enviar recordatorio por WhatsApp">
                                <Icon name="chat" className="h-4 w-4" /> Recordar
                              </button>
                            ) : (
                              <button onClick={() => enviar(inv)} className="btn-primario btn-sm px-3" title="Enviar por WhatsApp">
                                <Icon name="chat" className="h-4 w-4" /> Enviar
                              </button>
                            )}
                            <button onClick={() => copiar(inv)} className="btn-claro btn-sm px-3" title="Copiar link">
                              <Icon name="copy" className="h-4 w-4" /> {copiado === inv.id ? '¡Copiado!' : 'Link'}
                            </button>
                            <button onClick={() => setEditando({ ...inv })} className="rounded-lg p-2 text-cacao-500 hover:bg-arena" title="Editar">
                              <Icon name="edit" className="h-4 w-4" />
                            </button>
                            <button onClick={() => eliminar(inv)} className="rounded-lg p-2 text-cacao-300 hover:bg-rubor-100 hover:text-terracota" title="Eliminar">
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
