'use client'

import { useState } from 'react'
import Icon from '@/components/Icon'

// Campo de contraseña con botón para ver u ocultar lo que se escribe.
export default function CampoClave({ className = 'campo', ...props }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={ver ? 'text' : 'password'} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={ver}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-cacao-500 hover:text-terracota"
      >
        <Icon name={ver ? 'eye-off' : 'eye'} className="h-5 w-5" />
      </button>
    </div>
  )
}
