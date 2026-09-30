'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import { createClient } from '@/lib/supabase/client'
import { descargarIcs } from '@/lib/calendario'
import { Badge, Confirm, Drawer, Field, PageHeader, SearchInput, StatCard, Toggle, fechaCorta, useToast } from '@/components/admin/ui'

const VACIO = { id: null, nombres: '', fecha_boda: '', telefono: '', email: '', direccion: '', distrito: '', notas: '', activo: true }

function whatsapp(tel, texto) {
  const d = String(tel || '').replace(/\D/g, '')
  const n = d.length === 9 ? `51${d}` : d
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : null
}

const ordinal = (n) => `${n}.º`
const cuando = (dias) => (dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`)

export default function AniversariosAdmin({ clientes, error }) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null)
  const [historial, setHistorial] = useState([])
  const [envio, setEnvio] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [borrar, setBorrar] = useState(null)

  const activos = clientes.filter((c) => c.activo)
  const pendientes = activos.filter((c) => c.dias <= 15 && !c.enviado_este)
  const esteMes = activos.filter((c) => c.proximo.slice(0, 7) === new Date().toISOString().slice(0, 7))
  const anioActual = new Date().getFullYear()
  const enviadosAnio = activos.filter((c) => c.enviado_este && Number(c.proximo.slice(0, 4)) === anioActual).length
  const visibles = clientes.filter(
    (c) => !busqueda || `${c.nombres} ${c.telefono || ''} ${c.distrito || ''} ${c.notas || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function abrir(c) {
    setEditando({ ...VACIO, ...c })
    setHistorial([])
    if (c.id) {
      const { data } = await supabase
        .from('aniversario_envios')
        .select('id, anio, aniversario, regalo, notas, enviado_at')
        .eq('cliente_id', c.id)
        .order('anio', { ascending: false })
      setHistorial(data || [])
    }
  }

  const set = (campo) => (e) => setEditando((f) => ({ ...f, [campo]: e?.target ? e.target.value : e }))

  async function guardar(e) {
    e.preventDefault()
    const f = editando
    if (!f.nombres.trim() || !f.fecha_boda) return toast('Completa los nombres y la fecha de la boda', 'error')
    setGuardando(true)
    const datos = {
      nombres: f.nombres.trim(),
      fecha_boda: f.fecha_boda,
      telefono: f.telefono?.trim() || null,
      email: f.email?.trim() || null,
      direccion: f.direccion?.trim() || null,
      distrito: f.distrito?.trim() || null,
      notas: f.notas?.trim() || null,
      activo: !!f.activo,
    }
    const { error: err } = f.id
      ? await supabase.from('aniversario_clientes').update(datos).eq('id', f.id)
      : await supabase.from('aniversario_clientes').insert(datos)
    setGuardando(false)
    if (err) return toast(err.message, 'error')
    toast(f.id ? 'Cliente actualizado' : 'Cliente agregado a la bitácora')
    setEditando(null)
    router.refresh()
  }

  async function marcarEnviado(e) {
    e.preventDefault()
    setGuardando(true)
    const { error: err } = await supabase.from('aniversario_envios').insert({
      cliente_id: envio.id,
      anio: Number(envio.proximo.slice(0, 4)),
      aniversario: envio.aniversario,
      regalo: envio.regalo?.trim() || null,
      notas: envio.notasEnvio?.trim() || null,
    })
    setGuardando(false)
    if (err) return toast(/duplicate|unique/i.test(err.message) ? 'Ya marcaste el envío de este año' : err.message, 'error')
    toast(`Recuerdo de ${envio.nombres} marcado como enviado`)
    setEnvio(null)
    router.refresh()
  }

  async function eliminar() {
    const { error: err } = await supabase.from('aniversario_clientes').delete().eq('id', borrar.id)
    if (err) return toast(err.message, 'error')
    toast('Cliente eliminado de la bitácora')
    setBorrar(null)
    router.refresh()
  }

  function saludo(c) {
    return whatsapp(
      c.telefono,
      `¡Hola ${c.nombres}! 💐 Hoy se cumple su ${ordinal(c.aniversario)} aniversario de bodas y en Cherry Bloom Studio queremos celebrarlo con ustedes. ¡Gracias por confiar en nosotros para su gran día! Pronto les llegará un pequeño recuerdo.`
    )
  }

  return (
    <div>
      <PageHeader
        title="Aniversarios"
        description="Bitácora de las parejas que confiaron en nosotros, para enviarles un recuerdo en cada aniversario. Entran solas al aceptar su decoración; también puedes agregarlas a mano."
        actions={
          <>
            <button
              onClick={() => (activos.length ? descargarIcs(activos) : toast('No hay clientes activos', 'error'))}
              className="btn-claro btn-sm bg-white"
            >
              <Icon name="calendar" className="h-4 w-4" /> Agregar todos a mi calendario
            </button>
            <button onClick={() => abrir(VACIO)} className="btn-primario btn-sm">
              <Icon name="plus" className="h-4 w-4" /> Agregar cliente
            </button>
          </>
        }
      />

      {error && <p className="mb-4 rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Por enviar (15 días)" value={pendientes.length} sub="recuerdos que toca preparar" icon="gift" />
        <StatCard label="Aniversarios este mes" value={esteMes.length} icon="calendar" />
        <StatCard label="Enviados este año" value={enviadosAnio} icon="check" />
        <StatCard label="Clientes en la bitácora" value={activos.length} sub={`${clientes.length - activos.length} pausados`} icon="rings" />
      </div>

      {/* Toca enviar */}
      {pendientes.length > 0 && (
        <section className="mt-6 rounded-2xl border border-oro-300 bg-oro-100 p-5">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-cacao">
            <Icon name="gift" className="h-5 w-5 text-terracota" /> Toca preparar estos recuerdos
          </h2>
          <ul className="mt-3 divide-y divide-oro-300/60">
            {pendientes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[14rem] flex-1">
                  <p className="font-medium text-cacao">
                    {c.nombres} · {ordinal(c.aniversario)} aniversario
                  </p>
                  <p className="text-xs text-cacao-700">
                    {fechaCorta(c.proximo)} ({cuando(c.dias)})
                    {c.direccion ? ` · ${c.direccion}${c.distrito ? `, ${c.distrito}` : ''}` : ' · falta dirección de entrega'}
                    {c.ultimo_regalo ? ` · el año pasado: ${c.ultimo_regalo}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {saludo(c) && (
                    <a href={saludo(c)} target="_blank" rel="noreferrer" className="btn-claro btn-sm bg-white px-3">
                      <Icon name="chat" className="h-4 w-4" /> Saludar
                    </a>
                  )}
                  <button onClick={() => setEnvio({ ...c, regalo: '', notasEnvio: '' })} className="btn-primario btn-sm px-3">
                    <Icon name="check" className="h-4 w-4" /> Marcar enviado
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lista completa */}
      <div className="mt-6 mb-4 flex flex-col gap-3 rounded-2xl border border-arena-200 bg-white p-3 sm:flex-row sm:items-center">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, teléfono o distrito" />
        <span className="text-xs text-cacao-500 sm:ml-auto">Ordenado por próximo aniversario</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-arena-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-arena-200 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-cacao-500">
              <th className="px-4 py-3">Pareja</th>
              <th className="px-4 py-3">Boda</th>
              <th className="px-4 py-3">Próximo aniversario</th>
              <th className="px-4 py-3">Entrega</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-arena-200/70">
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-sm text-cacao-500">
                  {clientes.length === 0
                    ? 'Aún no hay clientes. Se agregan solos al marcar una solicitud de decoración como “Aceptada”, o agrégalos a mano.'
                    : 'Sin resultados.'}
                </td>
              </tr>
            )}
            {visibles.map((c) => (
              <tr key={c.id} className={`hover:bg-crema/60 ${c.activo ? '' : 'opacity-50'}`}>
                <td className="px-4 py-3">
                  <button onClick={() => abrir(c)} className="text-left">
                    <p className="font-medium text-cacao hover:text-terracota">{c.nombres}</p>
                    <p className="text-[11px] text-cacao-500">
                      {c.telefono || 'Sin teléfono'} {c.origen === 'decoracion' && '· cliente de decoración'}
                    </p>
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-cacao-700">{fechaCorta(c.fecha_boda)}</td>
                <td className="px-4 py-3">
                  <p className="whitespace-nowrap text-cacao">
                    {fechaCorta(c.proximo)} · {ordinal(c.aniversario)}
                  </p>
                  <p className="text-[11px] text-cacao-500">{cuando(c.dias)}</p>
                </td>
                <td className="max-w-[220px] px-4 py-3 text-xs text-cacao-700">
                  {c.direccion ? `${c.direccion}${c.distrito ? `, ${c.distrito}` : ''}` : <span className="text-terracota-700">Falta dirección</span>}
                </td>
                <td className="px-4 py-3">
                  {!c.activo ? (
                    <Badge>Pausado</Badge>
                  ) : c.enviado_este ? (
                    <Badge tono="ok">Enviado</Badge>
                  ) : c.dias <= 15 ? (
                    <Badge tono="alerta">Por enviar</Badge>
                  ) : (
                    <Badge>Programado</Badge>
                  )}
                  {c.envios > 0 && <p className="mt-1 text-[11px] text-cacao-500">{c.envios} enviados</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => descargarIcs([c], `aniversario-${c.nombres.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`)}
                      className="rounded-lg p-2 text-cacao-500 hover:bg-arena hover:text-cacao"
                      title="Agregar a mi calendario (aviso 15 días antes, cada año)"
                    >
                      <Icon name="calendar" className="h-4 w-4" />
                    </button>
                    {c.activo && !c.enviado_este && (
                      <button onClick={() => setEnvio({ ...c, regalo: '', notasEnvio: '' })} className="rounded-lg p-2 text-cacao-500 hover:bg-arena hover:text-cacao" title="Marcar enviado">
                        <Icon name="gift" className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => abrir(c)} className="rounded-lg p-2 text-cacao-500 hover:bg-arena hover:text-cacao" title="Editar">
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-cacao-500">
        <b>Consejo:</b> usa “Agregar todos a mi calendario” (o el ícono de calendario de cada pareja) y abre el archivo en tu
        celular: se crea un evento que se repite cada año, con aviso 15 días antes y otro 1 día antes. Así te recuerda aunque no
        entres al panel. Si agregas clientes nuevos, descarga de nuevo solo el de esa pareja.
      </p>

      {/* Editor */}
      <Drawer
        open={!!editando}
        onClose={() => setEditando(null)}
        title={editando?.id ? editando.nombres : 'Agregar cliente'}
        subtitle={editando?.id ? `En la bitácora desde ${fechaCorta(editando.created_at)}` : 'Pareja a la que enviaremos un recuerdo cada aniversario'}
        footer={
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-cacao-700">
              <Toggle checked={!!editando?.activo} onChange={(v) => setEditando((f) => ({ ...f, activo: v }))} label="Activo" />
              {editando?.activo ? 'Enviar recuerdos' : 'Pausado'}
            </label>
            <div className="flex gap-2">
              {editando?.id && (
                <button type="button" onClick={() => setBorrar(editando)} className="btn btn-sm text-terracota-800 hover:bg-rubor-100">
                  Eliminar
                </button>
              )}
              <button type="submit" form="form-aniv" disabled={guardando} className="btn-primario btn-sm">
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        }
      >
        {editando && (
          <form id="form-aniv" onSubmit={guardar} className="space-y-5">
            <Field label="Nombres de la pareja">
              <input value={editando.nombres} onChange={set('nombres')} className="campo bg-white" placeholder="Karen & Pedro" autoFocus />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha de la boda">
                <input type="date" value={editando.fecha_boda} onChange={set('fecha_boda')} className="campo bg-white" />
              </Field>
              <Field label="WhatsApp">
                <input value={editando.telefono || ''} onChange={set('telefono')} className="campo bg-white" placeholder="9XX XXX XXX" />
              </Field>
            </div>
            <Field label="Correo">
              <input type="email" value={editando.email || ''} onChange={set('email')} className="campo bg-white" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr,180px]">
              <Field label="Dirección de entrega">
                <input value={editando.direccion || ''} onChange={set('direccion')} className="campo bg-white" placeholder="Av. …, Dpto …" />
              </Field>
              <Field label="Distrito">
                <input value={editando.distrito || ''} onChange={set('distrito')} className="campo bg-white" placeholder="Surco" />
              </Field>
            </div>
            <Field label="Notas" hint="Gustos, colores de su boda, qué se decoró, ideas de recuerdo…">
              <textarea value={editando.notas || ''} onChange={set('notas')} rows={4} className="campo bg-white" />
            </Field>

            {editando.id && (
              <div className="rounded-2xl border border-arena-200 bg-white p-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-cacao-500">Recuerdos enviados</p>
                {historial.length === 0 ? (
                  <p className="text-sm text-cacao-500">Todavía ninguno.</p>
                ) : (
                  <ul className="divide-y divide-arena-200 text-sm">
                    {historial.map((h) => (
                      <li key={h.id} className="py-2">
                        <span className="font-medium text-cacao">
                          {h.anio} · {ordinal(h.aniversario)} aniversario
                        </span>
                        {h.regalo && <span className="text-cacao-700"> — {h.regalo}</span>}
                        {h.notas && <p className="text-xs text-cacao-500">{h.notas}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </form>
        )}
      </Drawer>

      {/* Marcar enviado */}
      <Drawer
        open={!!envio}
        onClose={() => setEnvio(null)}
        title="Marcar recuerdo enviado"
        subtitle={envio ? `${envio.nombres} · ${ordinal(envio.aniversario)} aniversario (${fechaCorta(envio.proximo)})` : ''}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEnvio(null)} className="btn-claro btn-sm">
              Cancelar
            </button>
            <button type="submit" form="form-envio" disabled={guardando} className="btn-primario btn-sm">
              {guardando ? 'Guardando…' : 'Marcar enviado'}
            </button>
          </div>
        }
      >
        {envio && (
          <form id="form-envio" onSubmit={marcarEnviado} className="space-y-5">
            {envio.ultimo_regalo && (
              <p className="rounded-xl bg-crema px-4 py-3 text-sm text-cacao-700">
                El último recuerdo que les enviaste fue: <b>{envio.ultimo_regalo}</b>
              </p>
            )}
            <Field label="¿Qué les enviaste?">
              <input
                value={envio.regalo}
                onChange={(e) => setEnvio({ ...envio, regalo: e.target.value })}
                className="campo bg-white"
                placeholder="Taza personalizada con su foto, caja de chocolates…"
                autoFocus
              />
            </Field>
            <Field label="Notas (opcional)">
              <textarea value={envio.notasEnvio} onChange={(e) => setEnvio({ ...envio, notasEnvio: e.target.value })} rows={3} className="campo bg-white" />
            </Field>
          </form>
        )}
      </Drawer>

      <Confirm
        open={!!borrar}
        title="¿Eliminar de la bitácora?"
        message={`Se borrarán ${borrar?.nombres} y su historial de recuerdos. Si solo quieres dejar de enviarles, usa “Pausado”.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={eliminar}
        onCancel={() => setBorrar(null)}
      />
    </div>
  )
}
