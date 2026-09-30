'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import { ToastProvider } from '@/components/admin/ui'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin', label: 'Resumen', icon: 'grid' },
  { href: '/admin/regalos', label: 'Catálogo de regalos', icon: 'gift' },
  { href: '/admin/decoracion', label: 'Decoración', icon: 'flower' },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: 'inbox', badge: 'solicitudes' },
  { href: '/admin/parejas', label: 'Parejas', icon: 'rings' },
  { href: '/admin/aniversarios', label: 'Aniversarios', icon: 'calendar', badge: 'aniversarios' },
  { href: '/admin/usuarios', label: 'Usuarios y accesos', icon: 'shield' },
]

export default function AdminShell({ email, solicitudesNuevas, aniversariosPendientes = 0, miBoda, children }) {
  const badges = { solicitudes: solicitudesNuevas, aniversarios: aniversariosPendientes }
  const pathname = usePathname()
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [claveAbierta, setClaveAbierta] = useState(false)

  async function salir() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const activo = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              activo ? 'bg-crema/10 text-white' : 'text-crema/65 hover:bg-crema/5 hover:text-crema'
            }`}
          >
            <Icon name={item.icon} className="h-[18px] w-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && badges[item.badge] > 0 && (
              <span className="rounded-full bg-terracota px-2 py-0.5 text-[11px] font-semibold text-white">{badges[item.badge]}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F7F1E9]">
        {/* Barra lateral */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-cacao py-6 transition-transform lg:translate-x-0 ${
            abierto ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Link href="/admin" className="mb-8 flex items-center gap-3 px-6">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-oro-300 bg-white p-0.5">
              <img src="/custom-logo.jpg" alt="" className="h-full w-full rounded-full object-cover" />
            </span>
            <span className="leading-none">
              <span className="block font-serif text-lg font-semibold text-crema">Cherry Bloom</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.25em] text-oro-300">Administración</span>
            </span>
          </Link>
          {nav}
          {miBoda && (
            <div className="mt-4 space-y-1 border-t border-crema/10 px-3 pt-4">
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.25em] text-crema/40">Mi boda</p>
              <Link href="/panel" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-crema/65 hover:bg-crema/5 hover:text-crema">
                <Icon name="heart" className="h-[18px] w-[18px]" /> Mi panel de novios
              </Link>
              <a href={`/boda/${miBoda}`} target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-crema/65 hover:bg-crema/5 hover:text-crema">
                <Icon name="external" className="h-[18px] w-[18px]" /> Mi página publicada
              </a>
            </div>
          )}
          <div className="mt-6 border-t border-crema/10 px-6 pt-5">
            <p className="truncate text-xs text-crema/60" title={email}>
              {email}
            </p>
            <div className="mt-3 flex gap-2">
              <a href="/" target="_blank" className="flex items-center gap-1.5 rounded-lg bg-crema/10 px-3 py-1.5 text-xs font-medium text-crema hover:bg-crema/15">
                <Icon name="external" className="h-3.5 w-3.5" /> Ver sitio
              </a>
              <button onClick={salir} className="rounded-lg px-3 py-1.5 text-xs font-medium text-crema/60 hover:bg-crema/10 hover:text-crema">
                Salir
              </button>
            </div>
            <button onClick={() => setClaveAbierta(true)} className="mt-2 flex items-center gap-1.5 text-xs text-crema/50 hover:text-crema">
              <Icon name="lock" className="h-3.5 w-3.5" /> Cambiar contraseña
            </button>
          </div>
        </aside>
        {abierto && <div className="fixed inset-0 z-40 bg-cacao/40 lg:hidden" onClick={() => setAbierto(false)} />}

        {/* Contenido */}
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-arena-200 bg-[#F7F1E9]/90 px-5 py-3 backdrop-blur lg:hidden">
            <button onClick={() => setAbierto(true)} className="rounded-lg p-1.5 text-cacao hover:bg-arena" aria-label="Menú">
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <span className="font-serif text-lg font-semibold text-cacao">Administración</span>
          </header>
          <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">{children}</main>
        </div>
        {claveAbierta && <CambiarClave onClose={() => setClaveAbierta(false)} />}
      </div>
    </ToastProvider>
  )
}

function CambiarClave({ onClose }) {
  const [clave, setClave] = useState('')
  const [repetir, setRepetir] = useState('')
  const [estado, setEstado] = useState({ cargando: false, error: '', ok: false })

  async function guardar(e) {
    e.preventDefault()
    if (clave.length < 8) return setEstado({ error: 'Usa al menos 8 caracteres.' })
    if (clave !== repetir) return setEstado({ error: 'Las contraseñas no coinciden.' })
    setEstado({ cargando: true })
    const { error } = await createClient().auth.updateUser({ password: clave })
    if (error) return setEstado({ error: error.message })
    setEstado({ ok: true })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-cacao/40" onClick={onClose} />
      <form onSubmit={guardar} className="relative w-full max-w-sm rounded-2xl bg-crema p-6 shadow-2xl">
        <h3 className="font-serif text-xl font-semibold text-cacao">Cambiar contraseña</h3>
        {estado.ok ? (
          <>
            <p className="mt-2 text-sm text-cacao-700">Listo, tu contraseña se actualizó. Úsala la próxima vez que inicies sesión.</p>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={onClose} className="btn-primario btn-sm">
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="mt-4 block">
              <span className="etiqueta">Nueva contraseña</span>
              <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} className="campo bg-white" autoComplete="new-password" required />
            </label>
            <label className="mt-3 block">
              <span className="etiqueta">Repítela</span>
              <input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} className="campo bg-white" autoComplete="new-password" required />
            </label>
            {estado.error && <p className="mt-3 text-sm text-terracota-800">{estado.error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-claro btn-sm">
                Cancelar
              </button>
              <button type="submit" disabled={estado.cargando} className="btn-primario btn-sm">
                {estado.cargando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
