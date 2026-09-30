'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/Icon'

// Caja con el link público de la boda: copiar o enviar por WhatsApp.
export default function CompartirLink({ slug, nombres }) {
  const [url, setUrl] = useState(`/boda/${slug}`)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    setUrl(`${base.replace(/\/$/, '')}/boda/${slug}`)
  }, [slug])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {}
  }

  const mensaje = `¡Hola! ${nombres} nos casamos 💍 Confirma tu asistencia y mira nuestra lista de regalos aquí: ${url}`

  return (
    <div className="tarjeta p-5">
      <span className="eyebrow">Link para sus invitados</span>
      <p className="mt-2 break-all font-medium text-cacao">{url}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copiar} className="btn-claro btn-sm">
          <Icon name="copy" className="h-4 w-4" />
          {copiado ? '¡Copiado!' : 'Copiar link'}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className="btn-primario btn-sm">
          <Icon name="chat" className="h-4 w-4" />
          Enviar por WhatsApp
        </a>
      </div>
    </div>
  )
}
