'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { soles } from '@/lib/escenarios'
import { linkWhatsAppA, mensajeAgradecimiento } from '@/lib/invitaciones'

// Lista de quienes regalaron, para agradecerles por WhatsApp.
export default function Agradecimientos({ aportes, couple }) {
  const router = useRouter()
  const supabase = createClient()
  const [ver, setVer] = useState('pendientes')
  const pendientes = aportes.filter((a) => !a.thanked_at)
  const lista = ver === 'pendientes' ? pendientes : aportes

  async function agradecer(a) {
    const texto = mensajeAgradecimiento({ nombre: a.guest_name, regalo: a.titulo, couple })
    window.open(linkWhatsAppA(a.telefono, texto), '_blank')
    await supabase.rpc('marcar_agradecido', { p_contribution_id: a.id })
    router.refresh()
  }

  async function marcar(a) {
    await supabase.rpc('marcar_agradecido', { p_contribution_id: a.id })
    router.refresh()
  }

  if (aportes.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Agradecimientos</h2>
          <p className="text-sm text-cacao-700">
            {pendientes.length ? `${pendientes.length} por agradecer` : '¡Ya agradecieron a todos!'}
          </p>
        </div>
        <div className="flex rounded-full border border-arena-300 p-0.5 text-xs font-medium">
          {[
            ['pendientes', 'Por agradecer'],
            ['todos', 'Todos'],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setVer(v)} className={`rounded-full px-4 py-1.5 ${ver === v ? 'bg-terracota text-crema' : 'text-cacao-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="tarjeta divide-y divide-arena-200">
        {lista.length === 0 && <p className="px-5 py-8 text-center text-sm text-cacao-500">Nada pendiente.</p>}
        {lista.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <Icon name="gift" className="h-4 w-4 shrink-0 text-rosa" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cacao">{a.guest_name}</p>
              <p className="text-xs text-cacao-500">
                {a.titulo}
                {Number(a.amount) > 0 ? ` · aportó ${soles(a.amount)}` : ''}
              </p>
            </div>
            {a.thanked_at ? (
              <span className="flex items-center gap-1 text-xs font-medium text-salvia">
                <Icon name="check" className="h-4 w-4" /> Agradecido
              </span>
            ) : (
              <div className="flex gap-1.5">
                <button onClick={() => agradecer(a)} className="btn-primario btn-sm px-3">
                  <Icon name="chat" className="h-4 w-4" /> Agradecer
                </button>
                <button onClick={() => marcar(a)} className="btn-claro btn-sm px-3" title="Ya le agradecí por otro medio">
                  Ya lo hice
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
