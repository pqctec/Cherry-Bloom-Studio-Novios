'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// En la página pública de cada boda el encabezado flota transparente sobre
// la foto de portada; en el resto del sitio es una barra color crema.
export default function Header() {
  const pathname = usePathname() || ''
  const [sesion, setSesion] = useState(null) // null = sin sesión

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setSesion(data.user ? {} : null)
    })
  }, [pathname])
  const sobreFoto = pathname === '/' || pathname.startsWith('/boda/')
  const enPanel = pathname.startsWith('/panel')
  if (pathname.startsWith('/admin')) return null

  return (
    <header
      className={
        sobreFoto
          ? 'absolute inset-x-0 top-0 z-50'
          : 'sticky top-0 z-50 border-b border-arena-200 bg-crema/90 backdrop-blur-md'
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-oro-300 bg-white p-0.5 shadow-sm">
            <img src="/custom-logo.jpg" alt="Cherry Bloom Studio" className="h-full w-full rounded-full object-cover" />
          </span>
          <span className="leading-none">
            <span className={`block font-serif text-lg font-semibold tracking-wide ${sobreFoto ? 'text-white' : 'text-cacao'}`}>
              Cherry Bloom Studio
            </span>
            <span className={`block font-script text-xl ${sobreFoto ? 'text-rubor' : 'text-rosa-600'}`}>Novios</span>
          </span>
        </a>

        {!enPanel && !pathname.startsWith('/boda/') && (
          <nav className="flex items-center gap-2 sm:gap-5">
            {sesion ? (
              <>
                <a href="/panel" className="btn-primario btn-sm">
                  Mi panel
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className={`hidden text-xs font-medium sm:inline ${sobreFoto ? 'text-white/90 hover:text-white' : 'text-cacao-700 hover:text-terracota'}`}
                >
                  Iniciar sesión
                </a>
                <a href="/registro" className="btn-primario btn-sm">
                  Crear mi página gratis
                </a>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
