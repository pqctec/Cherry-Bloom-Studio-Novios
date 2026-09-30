'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { soles } from '@/lib/escenarios'

// Tarjeta de regalo en la página del invitado. Tres tipos:
//  - producto normal: cada invitado toma 1 unidad hasta completar la cantidad
//  - producto compartido: cada invitado aporta un monto hasta completar el precio
//  - fondo de dinero: aportes libres (con meta opcional)
export default function GiftCard({ item: inicial, slug, codigo, alRegalar }) {
  const supabase = createClient()
  const [item, setItem] = useState(inicial)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gracias, setGracias] = useState(false)

  const esFondo = item.type === 'fondo'
  const compartido = item.type === 'producto' && item.shared
  const conMonto = esFondo || compartido
  const completo = item.status !== 'disponible'
  const quedan = Math.max(0, (item.quantity || 1) - (item.units_reserved || 0))
  const falta = compartido ? Math.max(0, Number(item.price) - Number(item.collected_amount)) : null
  const meta = compartido ? Number(item.price) : esFondo && item.target_amount ? Number(item.target_amount) : null
  const avance = meta ? Math.min(100, (Number(item.collected_amount) / meta) * 100) : null

  async function confirmar(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('regalar_con_invitacion', {
      p_slug: slug,
      p_code: codigo,
      p_gift_id: item.id,
      p_monto: conMonto ? Number(amount || 0) : null,
    })
    setLoading(false)
    if (rpcError) return setError(rpcError.message)
    setItem({ ...item, ...data })
    setOpen(false)
    setAmount('')
    setGracias(true)
    alRegalar?.(item)
  }

  return (
    <div className={`tarjeta flex flex-col overflow-hidden ${completo && !esFondo ? 'opacity-70' : ''} ${esFondo ? 'md:flex-row' : ''}`}>
      {esFondo ? (
        <div className="flex items-center justify-center bg-rubor-100 p-8 md:w-40">
          <Icon name="plane" className="h-12 w-12 text-terracota" />
        </div>
      ) : (
        <div className="relative flex aspect-[4/3] items-center justify-center bg-white p-6">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="h-full w-full object-contain" loading="lazy" />
          ) : (
            <Icon name="gift" className="h-12 w-12 text-rosa" />
          )}
          {completo ? (
            <span className="absolute right-3 top-3 rounded-full bg-salvia px-3 py-1 text-[11px] font-medium text-white">Ya regalado</span>
          ) : compartido ? (
            <span className="absolute left-3 top-3 rounded-full bg-oro-100 px-3 py-1 text-[11px] font-medium text-oro">Regalo compartido</span>
          ) : (
            (item.quantity || 1) > 1 && (
              <span className="absolute left-3 top-3 rounded-full bg-rubor-100 px-3 py-1 text-[11px] font-medium text-terracota-800">
                Quedan {quedan} de {item.quantity}
              </span>
            )
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col border-t border-arena-200 p-5 md:border-t-0">
        <h3 className="font-serif text-xl font-semibold leading-snug text-cacao">{item.title}</h3>
        {item.description && <p className="mt-1 text-xs leading-relaxed text-cacao-500">{item.description}</p>}

        {item.type === 'producto' && <p className="mt-3 font-serif text-2xl font-semibold text-terracota">{soles(item.price)}</p>}

        {conMonto && (
          <div className="mt-2">
            <p className="text-sm text-cacao-700">
              {soles(item.collected_amount)} reunidos{meta ? ` de ${soles(meta)}` : ''}
              {compartido && !completo && <span className="text-cacao-500"> · faltan {soles(falta)}</span>}
            </p>
            {avance !== null && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-arena">
                <div className="h-full rounded-full bg-gradient-to-r from-rosa to-terracota" style={{ width: `${avance}%` }} />
              </div>
            )}
          </div>
        )}

        {gracias && <p className="mt-3 rounded-xl bg-salvia-100 px-3 py-2 text-xs font-medium text-salvia">¡Gracias! Los novios verán tu regalo.</p>}

        {!completo && !open && codigo && (
          <button onClick={() => setOpen(true)} className="btn-primario btn-sm mt-4 w-full">
            <Icon name="heart" className="h-4 w-4" />
            {esFondo ? 'Hacer un aporte' : compartido ? 'Aportar a este regalo' : 'Quiero regalar esto'}
          </button>
        )}

        {!completo && open && (
          <form onSubmit={confirmar} className="mt-4 space-y-2.5 border-t border-arena-200 pt-4">
            {conMonto ? (
              <>
                <label className="etiqueta">¿Cuánto deseas aportar?</label>
                <input
                  type="number"
                  min="1"
                  max={compartido ? falta : undefined}
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={compartido ? `Hasta S/ ${falta}` : 'Monto (S/)'}
                  className="campo"
                />
                {compartido && (
                  <div className="flex flex-wrap gap-1.5">
                    {[50, 100, 200].filter((v) => v < falta).map((v) => (
                      <button key={v} type="button" onClick={() => setAmount(String(v))} className="btn-claro btn-sm px-3 py-1">
                        S/ {v}
                      </button>
                    ))}
                    <button type="button" onClick={() => setAmount(String(falta))} className="btn-claro btn-sm px-3 py-1">
                      Completar (S/ {falta})
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-cacao-700">¿Confirmas que quieres regalar esto a los novios?</p>
            )}
            {error && <p className="text-xs text-terracota-800">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn-primario btn-sm flex-1">
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-claro btn-sm">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
