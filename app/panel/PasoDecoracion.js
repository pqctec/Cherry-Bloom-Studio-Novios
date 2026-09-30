'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'

// Paso "¿Desean nuestro servicio de decoración?" del resumen.
export default function PasoDecoracion({ numero, coupleId, interes, solicitudes }) {
  const router = useRouter()
  const supabase = createClient()
  const [guardando, setGuardando] = useState(false)

  const hecho = interes === 'no' || (interes === 'si' && solicitudes > 0)

  async function responder(valor) {
    setGuardando(true)
    await supabase.from('couples').update({ decor_interest: valor }).eq('id', coupleId)
    setGuardando(false)
    if (valor === 'si') router.push('/panel/decoracion')
    else router.refresh()
  }

  let detalle = 'Arreglos de mesa, arco floral, mesa de dulces, panel de firmas y más, cotizados a la medida de su boda.'
  if (interes === 'no') detalle = 'Indicaron que por ahora no. Pueden activarlo cuando quieran.'
  if (interes === 'si' && solicitudes === 0) detalle = 'Elijan los servicios que les interesan y envíennos la solicitud de cotización.'
  if (interes === 'si' && solicitudes > 0) detalle = `Solicitud enviada (${solicitudes}). Les responderemos con su cotización.`

  return (
    <li
      className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
        hecho ? 'border-salvia-100 bg-salvia-100/40' : 'border-rosa/40 bg-rubor-100/40'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold ${
          hecho ? 'bg-salvia text-white' : 'bg-white text-terracota ring-1 ring-rosa/40'
        }`}
      >
        {hecho ? <Icon name="check" className="h-4 w-4" /> : numero}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-cacao">
          {interes === null ? '¿Desean nuestro servicio de decoración?' : 'Decoración de su boda'}
          {interes === 'no' && <span className="ml-2 text-xs font-normal text-cacao-500">· No por ahora</span>}
        </p>
        <p className="text-xs text-cacao-500">{detalle}</p>
      </div>
      {interes === null && (
        <div className="flex gap-2">
          <button disabled={guardando} onClick={() => responder('si')} className="btn-primario btn-sm">
            Sí, quiero ver opciones
          </button>
          <button disabled={guardando} onClick={() => responder('no')} className="btn-claro btn-sm">
            No, gracias
          </button>
        </div>
      )}
      {interes === 'si' && (
        <Link href="/panel/decoracion" className={hecho ? 'btn-claro btn-sm' : 'btn-primario btn-sm'}>
          {hecho ? 'Ver' : 'Elegir servicios'}
        </Link>
      )}
      {interes === 'no' && (
        <button disabled={guardando} onClick={() => responder('si')} className="btn-claro btn-sm">
          Activar decoración
        </button>
      )}
    </li>
  )
}
