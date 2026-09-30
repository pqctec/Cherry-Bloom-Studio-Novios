'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'

const ICONO = { confirmacion: 'heart', no_asiste: 'calendar', regalo: 'gift', aporte: 'gift' }

function hace(fecha) {
  const min = Math.round((Date.now() - new Date(fecha)) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ayer' : `hace ${d} días`
}

// Novedades para los novios: confirmaciones y regalos nuevos.
export default function Novedades({ avisos }) {
  const router = useRouter()
  const supabase = createClient()
  const [marcando, setMarcando] = useState(false)
  const nuevas = avisos.filter((a) => !a.read_at)

  async function marcarLeidas() {
    setMarcando(true)
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', nuevas.map((a) => a.id))
    setMarcando(false)
    router.refresh()
  }

  return (
    <section className="tarjeta p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold">
          Novedades
          {nuevas.length > 0 && (
            <span className="rounded-full bg-terracota px-2.5 py-0.5 font-sans text-xs font-semibold text-white">{nuevas.length} nuevas</span>
          )}
        </h2>
        {nuevas.length > 0 && (
          <button onClick={marcarLeidas} disabled={marcando} className="btn-claro btn-sm">
            <Icon name="check" className="h-4 w-4" /> Marcar como vistas
          </button>
        )}
      </div>
      {avisos.length === 0 ? (
        <p className="mt-4 text-sm text-cacao-500">Aquí verán cada confirmación y cada regalo apenas ocurra.</p>
      ) : (
        <ul className="mt-4 divide-y divide-arena-200">
          {avisos.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  a.read_at ? 'bg-arena text-cacao-500' : 'bg-rubor-100 text-terracota'
                }`}
              >
                <Icon name={ICONO[a.type] || 'heart'} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${a.read_at ? 'text-cacao-700' : 'font-medium text-cacao'}`}>{a.title}</p>
                {a.body && <p className="text-xs text-cacao-500">{a.body}</p>}
              </div>
              <span className="shrink-0 text-[11px] text-cacao-500">{hace(a.created_at)}</span>
              {!a.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terracota" />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
