'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { modelo as buscarModelo } from '@/lib/temas'
import Icon from '@/components/Icon'
import { soles } from '@/lib/escenarios'
import { Badge, PageHeader, SearchInput, descargarCsv, fechaCorta, useToast } from '@/components/admin/ui'

export default function ParejasAdmin({ parejas }) {
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('recientes')
  const hoy = new Date(new Date().toDateString())
  const router = useRouter()
  const toast = useToast()
  const [cambiando, setCambiando] = useState(null)

  async function alternarPro(p) {
    setCambiando(p.id)
    const { error } = await createClient().rpc('admin_activar_pro', { p_couple: p.id, p_activo: !p.pro_activo })
    setCambiando(null)
    if (error) return toast?.(error.message, 'error')
    toast?.(p.pro_activo ? 'PRO desactivado' : 'PRO activado: su invitación ya muestra el diseño PRO')
    router.refresh()
  }
  const solicitudesPro = parejas.filter((p) => p.pro_solicitado && !p.pro_activo).length

  const visibles = parejas
    .filter((p) => !busqueda || `${p.bride_name} ${p.groom_name} ${p.email || ''} ${p.venue || ''}`.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      if (orden === 'boda') return (a.wedding_date || '9999').localeCompare(b.wedding_date || '9999')
      return b.created_at.localeCompare(a.created_at)
    })

  function exportar() {
    descargarCsv(
      `parejas-${new Date().toISOString().slice(0, 10)}.csv`,
      ['bride_name', 'groom_name', 'email', 'wedding_date', 'venue', 'personas', 'productos', 'regalados', 'valor_regalado', 'fondos_recaudados', 'solicitudes', 'created_at'],
      parejas
    )
  }

  return (
    <div>
      <PageHeader
        title="Parejas"
        description={`Todas las parejas registradas, con sus confirmaciones, regalos y solicitudes.${solicitudesPro ? ` ${solicitudesPro} esperando activación del PRO.` : ''}`}
        actions={
          <button onClick={exportar} className="btn-claro btn-sm bg-white">
            <Icon name="download" className="h-4 w-4" /> Exportar
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-arena-200 bg-white p-3 sm:flex-row sm:items-center">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, correo o lugar" />
        <select value={orden} onChange={(e) => setOrden(e.target.value)} className="campo bg-white sm:w-56">
          <option value="recientes">Registradas recientemente</option>
          <option value="boda">Fecha de boda más próxima</option>
        </select>
        <span className="text-xs text-cacao-500 sm:ml-auto">{visibles.length} parejas</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-arena-200 bg-white">
        <table className="w-full min-w-[1050px] text-sm">
          <thead>
            <tr className="border-b border-arena-200 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-cacao-500">
              <th className="px-4 py-3">Pareja</th>
              <th className="px-4 py-3">Boda</th>
              <th className="px-4 py-3 text-center">Asistentes</th>
              <th className="px-4 py-3 text-center">Regalos</th>
              <th className="px-4 py-3 text-right">Regalado</th>
              <th className="px-4 py-3 text-right">Fondos</th>
              <th className="px-4 py-3 text-center">Decoración</th>
              <th className="px-4 py-3">Invitación</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-arena-200/70">
            {visibles.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center text-sm text-cacao-500">
                  Todavía no hay parejas registradas.
                </td>
              </tr>
            )}
            {visibles.map((p) => {
              const pasada = p.wedding_date && new Date(p.wedding_date + 'T00:00:00') < hoy
              return (
                <tr key={p.id} className="hover:bg-crema/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-cacao">
                      {p.bride_name} &amp; {p.groom_name}
                    </p>
                    <p className="text-[11px] text-cacao-500">
                      {p.email} · desde {fechaCorta(p.created_at)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-cacao">{fechaCorta(p.wedding_date)}</p>
                    <p className="max-w-[200px] truncate text-[11px] text-cacao-500">{p.venue || 'Lugar por definir'}</p>
                    {pasada && <Badge>Ya se casaron</Badge>}
                  </td>
                  <td className="px-4 py-3 text-center text-cacao">{p.personas}</td>
                  <td className="px-4 py-3 text-center text-cacao">
                    {p.regalados}/{p.productos}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-cacao">{soles(p.valor_regalado)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-cacao">{soles(p.fondos_recaudados)}</td>
                  <td className="px-4 py-3 text-center">{p.solicitudes > 0 ? <Badge tono="alerta">{p.solicitudes}</Badge> : <span className="text-cacao-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <p className="text-cacao">{p.modelo ? buscarModelo(p.modelo).nombre : 'Sin elegir'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.event_type === 'aniversario' && <Badge>Aniversario</Badge>}
                      {p.pro_activo ? <Badge tono="ok">PRO activo</Badge> : p.pro_solicitado ? <Badge tono="alerta">PRO solicitado</Badge> : null}
                      {(
                        <button
                          type="button"
                          onClick={() => alternarPro(p)}
                          disabled={cambiando === p.id}
                          className="rounded-full border border-arena-300 px-2 py-0.5 text-[11px] font-medium text-cacao-700 hover:bg-arena disabled:opacity-50"
                        >
                          {p.pro_activo ? 'Desactivar PRO' : 'Activar PRO'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/boda/${p.slug}`} target="_blank" className="inline-flex rounded-lg p-2 text-cacao-500 hover:bg-arena hover:text-terracota" title="Ver página">
                      <Icon name="external" className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
