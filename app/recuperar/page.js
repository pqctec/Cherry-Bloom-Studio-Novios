'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/AuthShell'
import { FOTOS } from '@/lib/escenarios'

// Paso 1 de "Olvidé mi contraseña": envía un correo con un enlace para elegir
// una contraseña nueva (llega a /restablecer).
export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState({ enviando: false, enviado: false, error: null })

  async function enviar(e) {
    e.preventDefault()
    setEstado({ enviando: true, enviado: false, error: null })
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    })
    if (error) {
      setEstado({
        enviando: false,
        enviado: false,
        error: /rate|limit|seconds/i.test(error.message) ? 'Espera un minuto antes de pedir otro enlace.' : error.message,
      })
      return
    }
    setEstado({ enviando: false, enviado: true, error: null })
  }

  return (
    <AuthShell foto={FOTOS.anilloCaja} frase="“Tranquilos, a todos nos pasa.”">
      <span className="eyebrow">¿Olvidaron su contraseña?</span>
      <h1 className="titulo mt-3 text-4xl sm:text-5xl">Recuperar acceso</h1>
      <p className="mt-3 text-sm text-cacao-700">Escriban el correo con el que se registraron y les enviaremos un enlace para elegir una contraseña nueva.</p>

      {estado.enviado ? (
        <div className="mt-10 rounded-2xl border border-salvia-100 bg-salvia-100/70 px-5 py-4 text-sm text-cacao">
          <b>Listo.</b> Si ese correo tiene una cuenta, en unos minutos les llegará el enlace. Revisen también la carpeta de spam.
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-10 space-y-5">
          <div>
            <label className="etiqueta" htmlFor="email">
              Correo electrónico
            </label>
            <input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
          </div>
          {estado.error && <p className="rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{estado.error}</p>}
          <button type="submit" disabled={estado.enviando} className="btn-primario w-full">
            {estado.enviando ? 'Enviando…' : 'Enviarme el enlace'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-cacao-500">
        <a href="/login" className="font-medium text-terracota underline">
          Volver a iniciar sesión
        </a>
      </p>
    </AuthShell>
  )
}
