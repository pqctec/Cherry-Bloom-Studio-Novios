'use client'

import { useEffect, useRef, useState } from 'react'

// Botón flotante de música. Arranca solo cuando el invitado abre el sobre
// (los navegadores no dejan reproducir sonido sin un toque previo).
export default function Musica({ url, nombre }) {
  const audio = useRef(null)
  const [sonando, setSonando] = useState(false)
  const [aviso, setAviso] = useState(true)

  useEffect(() => {
    const alAbrir = () => audio.current?.play().then(() => setSonando(true)).catch(() => {})
    window.addEventListener('cb-abrir-sobre', alAbrir)
    const t = setTimeout(() => setAviso(false), 7000)
    return () => {
      window.removeEventListener('cb-abrir-sobre', alAbrir)
      clearTimeout(t)
    }
  }, [])

  function alternar() {
    setAviso(false)
    const a = audio.current
    if (!a) return
    if (a.paused) a.play().then(() => setSonando(true)).catch(() => {})
    else {
      a.pause()
      setSonando(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
      {aviso && !sonando && (
        <span className="rounded-full px-3 py-1.5 text-xs shadow-lg" style={{ background: 'var(--t-card)', color: 'var(--t-text)', border: '1px solid var(--t-line)' }}>
          Toca para escuchar
        </span>
      )}
      <button
        type="button"
        onClick={alternar}
        aria-label={sonando ? `Pausar música (${nombre})` : `Reproducir música (${nombre})`}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ${sonando ? '' : 't-pulso'}`}
        style={{ background: 'var(--t-boton)', color: 'var(--t-on-accent)' }}
      >
        {sonando ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 5v14M16 5v14" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )}
      </button>
      <audio ref={audio} src={url} loop preload="none" />
    </div>
  )
}
