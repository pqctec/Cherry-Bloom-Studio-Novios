'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'

const SUGERENCIAS = [
  { icon: 'plane', title: 'Luna de miel', description: 'Ayúdennos a vivir el viaje de nuestros sueños.' },
  { icon: 'home', title: 'Nuestro primer hogar', description: 'Para ir armando juntos nuestro nuevo nido.' },
  { icon: 'heart', title: 'Cena romántica', description: 'Una noche especial para celebrar nuestro primer mes.' },
]

export default function FondoForm({ coupleId }) {
  const router = useRouter()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function usar(s) {
    setTitle(s.title)
    setDescription(s.description)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('gift_items').insert({
      couple_id: coupleId,
      type: 'fondo',
      title: title.trim(),
      description: description.trim() || null,
      target_amount: amount ? Number(amount) : null,
    })

    setLoading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setTitle('')
    setDescription('')
    setAmount('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="tarjeta space-y-4 p-5">
      <div className="flex flex-wrap gap-2">
        {SUGERENCIAS.map((s) => (
          <button key={s.title} type="button" onClick={() => usar(s)} className="btn-claro btn-sm">
            <Icon name={s.icon} className="h-4 w-4" />
            {s.title}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr,180px]">
        <div>
          <label className="etiqueta">Nombre del fondo</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="campo" placeholder="Luna de miel en Cusco" />
        </div>
        <div>
          <label className="etiqueta">Meta en S/ (opcional)</label>
          <input type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="campo" placeholder="3000" />
        </div>
      </div>
      <div>
        <label className="etiqueta">Mensaje para sus invitados (opcional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="campo" />
      </div>
      {error && <p className="text-sm text-terracota-800">{error}</p>}
      <button type="submit" disabled={loading || !title.trim()} className="btn-primario btn-sm">
        {loading ? 'Creando...' : 'Crear fondo'}
      </button>
    </form>
  )
}
