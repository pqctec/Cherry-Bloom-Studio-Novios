'use client'

import { useEffect, useState } from 'react'

function calcular(weddingDate) {
  const diff = new Date(weddingDate + 'T00:00:00') - new Date()
  if (diff <= 0) return null
  return {
    días: Math.floor(diff / 86400000),
    horas: Math.floor((diff / 3600000) % 24),
    min: Math.floor((diff / 60000) % 60),
  }
}

export default function Countdown({ weddingDate }) {
  const [t, setT] = useState(null)

  useEffect(() => {
    if (!weddingDate) return
    setT(calcular(weddingDate))
    const id = setInterval(() => setT(calcular(weddingDate)), 30000)
    return () => clearInterval(id)
  }, [weddingDate])

  if (!weddingDate || !t) return null

  return (
    <div className="inline-flex gap-3">
      {Object.entries(t).map(([k, v]) => (
        <div key={k} className="min-w-[76px] rounded-2xl border border-white/30 bg-white/10 px-3 py-3 backdrop-blur-md">
          <span className="block font-serif text-3xl font-semibold leading-none">{v}</span>
          <span className="mt-1 block text-[10px] uppercase tracking-[0.25em] text-white/80">{k}</span>
        </div>
      ))}
    </div>
  )
}
