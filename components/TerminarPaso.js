'use client'

import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'

// Botón para cerrar un paso de la preparación: confirma y vuelve al resumen.
export default function TerminarPaso({ paso, texto, deshabilitado, motivo }) {
  const router = useRouter()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-arena-200 bg-white/70 px-5 py-4">
      <p className="text-sm text-cacao-700">
        {deshabilitado ? motivo : '¿Terminaron por ahora? Pueden volver a editar cuando quieran.'}
      </p>
      <button
        type="button"
        disabled={deshabilitado}
        onClick={() => {
          router.push(`/panel?listo=${paso}`)
          router.refresh()
        }}
        className="btn-primario btn-sm"
      >
        <Icon name="check" className="h-4 w-4" /> {texto}
      </button>
    </div>
  )
}
