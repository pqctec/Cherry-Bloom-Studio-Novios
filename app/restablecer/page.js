'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/AuthShell'
import { FOTOS } from '@/lib/escenarios'

// Paso 2 de "Olvidé mi contraseña": se llega desde el enlace del correo.
function Restablecer() {
  const router = useRouter()
  const params = useSearchParams()
  const [listo, setListo] = useState(null) // null = comprobando, true = puede cambiar, false = enlace inválido
  const [clave, setClave] = useState('')
  const [repetir, setRepetir] = useState('')
  const [estado, setEstado] = useState({ guardando: false, error: null })

  useEffect(() => {
    const supabase = createClient()
    let activo = true
    async function comprobar() {
      let {
        data: { session },
      } = await supabase.auth.getSession()
      const code = params.get('code')
      if (!session && code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => {})
        ;({
          data: { session },
        } = await supabase.auth.getSession())
      }
      if (activo) setListo(!!session)
    }
    comprobar()
    return () => {
      activo = false
    }
  }, [params])

  async function guardar(e) {
    e.preventDefault()
    if (clave.length < 8) return setEstado({ guardando: false, error: 'Usa al menos 8 caracteres.' })
    if (clave !== repetir) return setEstado({ guardando: false, error: 'Las contraseñas no coinciden.' })
    setEstado({ guardando: true, error: null })
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: clave })
    if (error) return setEstado({ guardando: false, error: error.message })
    const { data: esAdmin } = await supabase.rpc('es_admin')
    router.push(esAdmin ? '/admin' : '/panel')
    router.refresh()
  }

  return (
    <AuthShell foto={FOTOS.anilloCaja} frase="“Un nuevo comienzo.”">
      <span className="eyebrow">Recuperar acceso</span>
      <h1 className="titulo mt-3 text-4xl sm:text-5xl">Nueva contraseña</h1>

      {listo === null && <p className="mt-6 text-sm text-cacao-700">Comprobando el enlace…</p>}

      {listo === false && (
        <div className="mt-8 space-y-4">
          <p className="rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">
            Este enlace ya no es válido o venció. Pidan uno nuevo y ábranlo en este mismo navegador.
          </p>
          <a href="/recuperar" className="btn-primario w-full">
            Pedir un enlace nuevo
          </a>
        </div>
      )}

      {listo && (
        <form onSubmit={guardar} className="mt-10 space-y-5">
          <div>
            <label className="etiqueta" htmlFor="clave">
              Nueva contraseña
            </label>
            <input id="clave" type="password" autoComplete="new-password" required value={clave} onChange={(e) => setClave(e.target.value)} className="campo" />
          </div>
          <div>
            <label className="etiqueta" htmlFor="repetir">
              Repítela
            </label>
            <input id="repetir" type="password" autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} className="campo" />
          </div>
          {estado.error && <p className="rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{estado.error}</p>}
          <button type="submit" disabled={estado.guardando} className="btn-primario w-full">
            {estado.guardando ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

export default function RestablecerPage() {
  return (
    <Suspense>
      <Restablecer />
    </Suspense>
  )
}
