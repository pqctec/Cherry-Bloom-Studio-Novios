'use client'

import { useEffect, useState } from 'react'

function calcular(fecha, hora) {
  const objetivo = new Date(`${fecha}T${/^\d{2}:\d{2}$/.test(hora || '') ? hora : '00:00'}:00`)
  const diff = objetivo - new Date()
  if (diff <= 0) return null
  return [
    ['días', Math.floor(diff / 86400000)],
    ['horas', Math.floor((diff / 3600000) % 24)],
    ['min', Math.floor((diff / 60000) % 60)],
    ['seg', Math.floor((diff / 1000) % 60)],
  ]
}

// Cuenta regresiva. variante "foto": cristal sobre una imagen; "tema": con los
// colores del modelo de invitación.
export default function CuentaRegresiva({ fecha, hora, variante = 'tema' }) {
  const [t, setT] = useState(null)

  useEffect(() => {
    if (!fecha) return
    setT(calcular(fecha, hora))
    const id = setInterval(() => setT(calcular(fecha, hora)), 1000)
    return () => clearInterval(id)
  }, [fecha, hora])

  if (!fecha || !t) return null

  const foto = variante === 'foto'
  return (
    <div className="grid w-full max-w-sm grid-cols-4 gap-2" role="timer" aria-label="Cuenta regresiva">
      {t.map(([k, v]) => (
        <div
          key={k}
          className={`rounded-2xl px-1 py-2.5 text-center ${foto ? 'border border-white/30 bg-white/10 backdrop-blur-md' : ''}`}
          style={foto ? undefined : { background: 'var(--t-card)', border: '1px solid var(--t-line)' }}
        >
          <span className="block text-2xl font-semibold leading-none sm:text-3xl" style={{ fontFamily: foto ? undefined : 'var(--t-display)' }}>
            {String(v).padStart(2, '0')}
          </span>
          <span className={`mt-1 block text-[10px] uppercase tracking-[0.2em] ${foto ? 'text-white/80' : 't-muted'}`}>{k}</span>
        </div>
      ))}
    </div>
  )
}
