'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { soles } from '@/lib/escenarios'

export default function Catalogo({ productos, enLista }) {
  const router = useRouter()
  const supabase = createClient()
  const [categoria, setCategoria] = useState('Todo')
  const [busqueda, setBusqueda] = useState('')
  const [agregando, setAgregando] = useState(null)
  const [agregados, setAgregados] = useState(() => new Set(enLista))
  const [error, setError] = useState(null)

  const categorias = useMemo(() => ['Todo', ...new Set(productos.map((p) => p.category))], [productos])

  const visibles = productos.filter((p) => {
    if (categoria !== 'Todo' && p.category !== categoria) return false
    if (busqueda && !`${p.title} ${p.description || ''}`.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  async function agregar(p) {
    setAgregando(p.id)
    setError(null)
    const { error: rpcError } = await supabase.rpc('agregar_regalo_catalogo', { p_catalog_id: p.id })
    setAgregando(null)
    if (rpcError && !/ya está en tu lista/i.test(rpcError.message)) {
      setError(rpcError.message)
      return
    }
    setAgregados((s) => new Set(s).add(p.id))
    router.refresh()
  }

  if (productos.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-arena-300 p-10 text-center text-sm text-cacao-500">
        El catálogo todavía está vacío.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                categoria === c ? 'bg-terracota text-crema' : 'border border-arena-300 bg-white/70 text-cacao-700 hover:bg-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cacao-300" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en el catálogo" className="campo pl-9" />
        </label>
      </div>

      {error && <p className="mb-4 rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {visibles.map((p) => {
          const ya = agregados.has(p.id)
          return (
            <div key={p.id} className="tarjeta flex flex-col overflow-hidden">
              <div className="flex aspect-square items-center justify-center bg-white p-4">
                {p.image_url && <img src={p.image_url} alt={p.title} className="h-full w-full object-contain" loading="lazy" />}
              </div>
              <div className="flex flex-1 flex-col border-t border-arena-200 p-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-rosa-600">{p.category}</span>
                <h3 className="mt-1 line-clamp-2 text-sm font-medium text-cacao">{p.title}</h3>
                {p.description && <p className="mt-1 line-clamp-2 text-xs text-cacao-500">{p.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="font-serif text-xl font-semibold text-terracota">{soles(p.price)}</span>
                  {ya ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-salvia">
                      <Icon name="check" className="h-4 w-4" /> En su lista
                    </span>
                  ) : (
                    <button type="button" onClick={() => agregar(p)} disabled={agregando === p.id} className="btn-primario btn-sm px-3">
                      <Icon name="plus" className="h-3.5 w-3.5" />
                      {agregando === p.id ? '...' : 'Agregar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {visibles.length === 0 && <p className="py-10 text-center text-sm text-cacao-500">No encontramos productos con ese filtro.</p>}
    </div>
  )
}
