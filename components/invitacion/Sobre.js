'use client'

import { useEffect, useState } from 'react'

// Sobre de apertura: cubre la invitación hasta que el invitado toca el sello.
export default function Sobre({ iniciales, para }) {
  const [estado, setEstado] = useState('cerrado') // cerrado → abriendo → listo

  useEffect(() => {
    document.body.style.overflow = estado === 'listo' ? '' : 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [estado])

  function abrir() {
    if (estado !== 'cerrado') return
    setEstado('abriendo')
    window.dispatchEvent(new Event('cb-abrir-sobre'))
    setTimeout(() => setEstado('listo'), 1500)
  }

  if (estado === 'listo') return null
  const abriendo = estado === 'abriendo'

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-7 px-6 text-center transition-opacity duration-700"
      style={{ background: 'var(--t-alt)', opacity: abriendo ? 0 : 1, transitionDelay: abriendo ? '800ms' : '0ms' }}
    >
      <p className="text-xl italic sm:text-2xl" style={{ fontFamily: 'var(--t-display)' }}>
        {para ? `Para: ${para}` : 'Tienes una invitación'}
      </p>
      <div className="relative h-[220px] w-[320px] max-w-full" style={{ perspective: '900px' }}>
        {/* Tarjeta que asoma al abrir */}
        <div
          className="absolute inset-x-5 top-4 h-40 rounded-md transition-transform duration-700"
          style={{ background: 'var(--t-card)', transform: abriendo ? 'translateY(-70px)' : 'translateY(0)', transitionDelay: abriendo ? '350ms' : '0ms', boxShadow: '0 4px 14px rgba(0,0,0,.08)' }}
        />
        {/* Cuerpo del sobre */}
        <div className="absolute inset-0 overflow-hidden rounded-md" style={{ background: 'color-mix(in srgb, var(--t-soft) 35%, var(--t-card))', boxShadow: '0 18px 40px rgba(0,0,0,.18)' }}>
          <svg aria-hidden="true" viewBox="0 0 320 220" className="absolute inset-0 h-full w-full">
            <path d="M0 220 L130 105 M320 220 L190 105" stroke="var(--t-line)" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
        {/* Solapa */}
        <svg
          aria-hidden="true"
          viewBox="0 0 320 130"
          className="absolute inset-x-0 top-0 h-[130px] w-full transition-transform duration-500"
          style={{ transformOrigin: 'top', transform: abriendo ? 'rotateX(180deg)' : 'rotateX(0deg)', zIndex: abriendo ? 0 : 2 }}
        >
          <path d="M0 0 L160 125 L320 0 Z" fill="color-mix(in srgb, var(--t-soft) 55%, var(--t-card))" stroke="var(--t-line)" strokeWidth="1" />
        </svg>
        {/* Sello */}
        <button
          type="button"
          onClick={abrir}
          aria-label="Abrir la invitación"
          className="absolute left-1/2 top-[88px] z-10 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full text-[26px] transition-opacity duration-300"
          style={{
            background: 'var(--t-accent)',
            color: 'var(--t-on-accent)',
            fontFamily: '"Great Vibes", cursive',
            boxShadow: 'inset 0 0 0 5px rgba(255,255,255,.18), 0 6px 14px rgba(0,0,0,.25)',
            opacity: abriendo ? 0 : 1,
          }}
        >
          {iniciales}
        </button>
      </div>
      <p className="t-eyebrow">Toca el sello para abrir</p>
    </div>
  )
}
