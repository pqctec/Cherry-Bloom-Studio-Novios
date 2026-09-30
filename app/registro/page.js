'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/AuthShell'

function slugify(groomName, brideName) {
  const base = `${brideName}-y-${groomName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    email: '',
    password: '',
    groomName: '',
    brideName: '',
    weddingDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Los datos de la boda viajan como metadata del usuario. Un trigger en
      // la base de datos (handle_new_couple, ver supabase/schema.sql) crea la
      // fila de "couples" en el mismo momento en que se crea el usuario, así
      // que funciona igual con o sin confirmación de correo activada.
      const slug = slugify(form.groomName, form.brideName)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            slug,
            groom_name: form.groomName,
            bride_name: form.brideName,
            wedding_date: form.weddingDate || null,
          },
        },
      })
      if (signUpError) throw signUpError

      if (!signUpData.session) {
        // Confirmación por correo activada: la cuenta y la boda ya existen,
        // solo falta que confirme el correo e inicie sesión.
        setError(
          'Te enviamos un correo de confirmación. Confirma tu cuenta y luego inicia sesión para entrar a tu panel.'
        )
        return
      }

      router.push('/panel')
      router.refresh()
    } catch (err) {
      setError(err.message || 'Ocurrió un error, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell frase="“El amor no se mira, se siente — y más aún cuando está a tu lado.”">
      <span className="eyebrow">Crea su página gratis</span>
      <h1 className="titulo mt-3 text-4xl sm:text-5xl">Cuéntennos de ustedes</h1>
      <p className="mt-3 text-sm text-cacao-700">
        En un minuto tienen su página lista para compartir con sus invitados.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="etiqueta">Nombre de la novia</label>
            <input required value={form.brideName} onChange={update('brideName')} className="campo" placeholder="Ana" />
          </div>
          <div>
            <label className="etiqueta">Nombre del novio</label>
            <input required value={form.groomName} onChange={update('groomName')} className="campo" placeholder="Luis" />
          </div>
        </div>

        <div>
          <label className="etiqueta">Fecha de la boda (opcional)</label>
          <input type="date" value={form.weddingDate} onChange={update('weddingDate')} className="campo" />
        </div>

        <div className="border-t border-arena-200 pt-5">
          <label className="etiqueta">Correo electrónico</label>
          <input required type="email" value={form.email} onChange={update('email')} className="campo" placeholder="sucorreo@ejemplo.com" />
        </div>

        <div>
          <label className="etiqueta">Contraseña</label>
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={update('password')}
            className="campo"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-cacao-700">
          <input required type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#A8553A]" />
          <span>
            Acepto la{' '}
            <a href="/privacidad" target="_blank" className="font-medium text-terracota underline">
              política de privacidad
            </a>{' '}
            y el uso de los datos de mis invitados para gestionar nuestra boda.
          </span>
        </label>

        {error && <p className="rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primario w-full">
          {loading ? 'Creando su página...' : 'Crear nuestra página'}
        </button>

        <p className="text-center text-xs text-cacao-500">
          ¿Ya tienen cuenta?{' '}
          <a href="/login" className="font-medium text-terracota underline">
            Inicien sesión
          </a>
        </p>
      </form>
    </AuthShell>
  )
}
