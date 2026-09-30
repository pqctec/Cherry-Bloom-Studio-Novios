'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { soles } from '@/lib/escenarios'

export default function GiftRow({ item, aportes = [] }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const esProducto = item.type === 'producto'
  const conAportes = (item.units_reserved || 0) > 0 || Number(item.collected_amount) > 0
  const completo = item.status !== 'disponible'
  const avance = item.shared
    ? Math.min(100, (Number(item.collected_amount) / Number(item.price || 1)) * 100)
    : item.type === 'fondo' && item.target_amount
      ? Math.min(100, (Number(item.collected_amount) / Number(item.target_amount)) * 100)
      : null

  async function configurar(cantidad, compartido) {
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.rpc('configurar_regalo', { p_gift_id: item.id, p_cantidad: cantidad, p_compartido: compartido })
    setLoading(false)
    if (err) return setError(err.message)
    router.refresh()
  }

  async function handleDelete() {
    if (conAportes && !window.confirm('Algunos invitados ya eligieron este regalo. ¿Seguro que quieren quitarlo?')) return
    setLoading(true)
    await supabase.from('gift_items').delete().eq('id', item.id)
    setLoading(false)
    router.refresh()
  }

  const nombres = [...new Set(aportes.map((a) => a.guest_name))]

  return (
    <div className="tarjeta p-3">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
          {item.image_url ? (
            <img src={item.image_url} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <Icon name={item.type === 'fondo' ? 'plane' : 'gift'} className="h-6 w-6 text-rosa" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-cacao">{item.title}</h3>
          <p className="text-xs text-cacao-500">
            {esProducto && !item.shared && `${soles(item.price)} c/u · ${item.units_reserved || 0} de ${item.quantity} elegidos`}
            {esProducto && item.shared && `${soles(item.collected_amount)} de ${soles(item.price)} · regalo compartido`}
            {item.type === 'fondo' && `${soles(item.collected_amount)} reunidos${item.target_amount ? ` de ${soles(item.target_amount)}` : ''}`}
          </p>
          {completo && (
            <span className="mt-1 inline-block rounded-full bg-salvia-100 px-2 py-0.5 text-[11px] font-medium text-salvia">
              {item.type === 'fondo' ? 'Meta alcanzada' : 'Completo'}
            </span>
          )}
        </div>
        <button onClick={handleDelete} disabled={loading} className="shrink-0 px-2 text-xs font-medium text-cacao-300 hover:text-terracota disabled:opacity-50">
          Quitar
        </button>
      </div>

      {avance !== null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-arena">
          <div className="h-full rounded-full bg-gradient-to-r from-rosa to-terracota" style={{ width: `${avance}%` }} />
        </div>
      )}

      {esProducto && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-arena-200 pt-3">
          {!item.shared ? (
            <div className="flex items-center gap-2 text-xs text-cacao-700">
              Cantidad
              <button
                type="button"
                disabled={loading || item.quantity <= Math.max(1, item.units_reserved || 0)}
                onClick={() => configurar(item.quantity - 1, false)}
                className="btn-claro btn-sm h-7 w-7 px-0"
              >
                −
              </button>
              <span className="w-5 text-center font-serif text-lg font-semibold text-cacao">{item.quantity}</span>
              <button type="button" disabled={loading || item.quantity >= 50} onClick={() => configurar(item.quantity + 1, false)} className="btn-claro btn-sm h-7 w-7 px-0">
                +
              </button>
            </div>
          ) : (
            <span className="text-xs text-cacao-700">Varios invitados aportan hasta completar el precio</span>
          )}
          <label className={`flex items-center gap-2 text-xs ${conAportes ? 'opacity-50' : ''}`} title={conAportes ? 'Ya tiene aportes: no se puede cambiar el modo' : ''}>
            <input
              type="checkbox"
              checked={!!item.shared}
              disabled={loading || conAportes}
              onChange={(e) => configurar(1, e.target.checked)}
              className="h-4 w-4 accent-[#A8553A]"
            />
            Regalo compartido
          </label>
        </div>
      )}

      {nombres.length > 0 && <p className="mt-2 text-[11px] text-cacao-500">Lo regalan: {nombres.join(', ')}</p>}
      {error && <p className="mt-2 text-xs text-terracota-800">{error}</p>}
    </div>
  )
}
