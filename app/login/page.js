'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/AuthShell'
import { FOTOS } from '@/lib/escenarios'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(
        /confirm/i.test(signInError.message)
          ? 'Aún no confirman su correo. Revisen su bandeja de entrada (y spam) y abran el enlace que les enviamos.'
          : 'Correo o contraseña incorrectos.'
      )
      setLoading(false)
      return
    }

    // El administrador entra a /admin (ahí tiene "Mi boda" para ir a su panel
    // de novios y a su página publicada); las parejas entran a su panel.
    let destino = searchParams.get('next')
    if (!destino) {
      const { data: esAdmin } = await supabase.rpc('es_admin')
      destino = esAdmin ? '/admin' : '/panel'
    }
    router.push(destino)
    router.refresh()
  }

  return (
    <AuthShell foto={FOTOS.anilloCaja} frase="“Bienvenidos de vuelta. Sigamos preparando su gran día.”">
      <span className="eyebrow">Su panel de novios</span>
      <h1 className="titulo mt-3 text-4xl sm:text-5xl">Inicien sesión</h1>
      <p className="mt-3 text-sm text-cacao-700">Entren para ver quiénes confirmaron y administrar su lista de regalos.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div>
          <label className="etiqueta">Correo electrónico</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
        </div>
        <div>
          <label className="etiqueta">Contraseña</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="campo" />
        </div>

        {error && <p className="rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primario w-full">
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <p className="text-center text-xs text-cacao-500">
          ¿Aún no tienen página?{' '}
          <a href="/registro" className="font-medium text-terracota underline">
            Créenla gratis
          </a>
        </p>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
