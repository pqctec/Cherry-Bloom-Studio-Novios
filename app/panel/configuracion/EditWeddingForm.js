'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { ESCENARIOS } from '@/lib/escenarios'
import { PLAZOS, fechaLimite, fechaLarga } from '@/lib/invitaciones'
import PortadaPropia from './PortadaPropia'
import { aniosDeCasados, nombreBodas } from '@/lib/temas'

export default function EditWeddingForm({ couple, privado }) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    groomName: couple.groom_name || '',
    brideName: couple.bride_name || '',
    weddingDate: couple.wedding_date || '',
    venue: couple.venue || '',
    coverMessage: couple.cover_message || '',
    coverTheme: couple.cover_theme || 'atardecer',
    coverUrl: couple.cover_url || '',
    plazo: couple.rsvp_deadline_days || 30,
    eventType: couple.event_type || 'boda',
    originalDate: couple.original_wedding_date || '',
    gifts: couple.gifts_enabled !== false,
    whatsapp: privado?.whatsapp || '',
    avisar: privado?.notify_whatsapp ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setSaved(false)
    setForm((f) => ({ ...f, [field]: value }))
  }
  const update = (field) => (e) => set(field, e.target.value)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('couples')
      .update({
        groom_name: form.groomName,
        bride_name: form.brideName,
        wedding_date: form.weddingDate || null,
        venue: form.venue || null,
        cover_message: form.coverMessage || null,
        cover_theme: form.coverTheme,
        cover_url: form.coverUrl || null,
        rsvp_deadline_days: Number(form.plazo),
        event_type: form.eventType,
        original_wedding_date: form.eventType === 'aniversario' ? form.originalDate || null : null,
        gifts_enabled: !!form.gifts,
      })
      .eq('id', couple.id)

    const { error: privError } = updateError
      ? { error: null }
      : await supabase.from('couple_private').upsert({
          couple_id: couple.id,
          whatsapp: form.whatsapp.trim() || null,
          notify_whatsapp: !!form.avisar,
          updated_at: new Date().toISOString(),
        })

    setLoading(false)
    if (updateError || privError) {
      setError((updateError || privError).message)
      return
    }
    setSaved(true)
    // Paso terminado: confirmamos y volvemos al resumen.
    router.push('/panel?listo=datos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="tarjeta max-w-xl space-y-5 p-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold">¿Qué celebran?</h2>
          <p className="text-xs text-cacao-500">Cambia los textos de la invitación (boda o aniversario).</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['boda', 'Nuestra boda'],
            ['aniversario', 'Nuestro aniversario'],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                set('eventType', v)
                if (v === 'aniversario' && form.eventType !== 'aniversario') set('gifts', false)
                if (v === 'boda' && form.eventType !== 'boda') set('gifts', true)
              }}
              aria-pressed={form.eventType === v}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                form.eventType === v ? 'border-terracota bg-terracota text-crema' : 'border-arena-300 bg-white text-cacao-700 hover:bg-arena'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        {form.eventType === 'aniversario' && (
          <div>
            <label className="etiqueta" htmlFor="original">
              ¿Cuándo se casaron?
            </label>
            <input id="original" type="date" value={form.originalDate} onChange={update('originalDate')} className="campo" />
            {aniosDeCasados(form.originalDate, form.weddingDate) && (
              <p className="mt-2 text-sm text-terracota">
                Celebran {aniosDeCasados(form.originalDate, form.weddingDate)} años
                {nombreBodas(aniosDeCasados(form.originalDate, form.weddingDate)) ? ` · ${nombreBodas(aniosDeCasados(form.originalDate, form.weddingDate))}` : ''}
              </p>
            )}
          </div>
        )}
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={form.gifts} onChange={(e) => set('gifts', e.target.checked)} className="mt-1 h-4 w-4 accent-[#A8553A]" />
          <span>
            <span className="block text-sm font-medium text-cacao">Incluir lista de regalos</span>
            <span className="block text-xs text-cacao-500">
              {form.eventType === 'aniversario' ? 'Opcional en aniversarios: si la apagan, la invitación no muestra regalos.' : 'Sus invitados podrán elegir un regalo desde su invitación.'}
            </span>
          </span>
        </label>
      </div>

      <div>
        <h2 className="mb-1 font-serif text-2xl font-semibold">Portada</h2>
        <p className="mb-3 text-xs text-cacao-500">
          Elijan uno de nuestros escenarios o suban su propia foto. Se usa de fondo en el modelo “Clásica con foto”; en los demás modelos su
          foto propia aparece enmarcada.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ESCENARIOS.map((e) => {
            const activo = form.coverTheme === e.id
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => set('coverTheme', e.id)}
                className={`group relative overflow-hidden rounded-2xl text-left ring-offset-2 ring-offset-crema transition ${
                  activo ? 'ring-2 ring-terracota' : 'hover:opacity-90'
                }`}
              >
                <img src={e.mini} alt={e.nombre} className="h-28 w-full object-cover sm:h-32" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cacao/80 to-transparent p-2.5 font-serif text-base text-white">
                  {e.nombre}
                </span>
                {activo && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-terracota text-white">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-4">
          <PortadaPropia
            coupleId={couple.id}
            valor={form.coverUrl}
            activa={form.coverTheme === 'propia'}
            nombres={`${form.brideName || 'Novia'} & ${form.groomName || 'Novio'}`}
            onSubida={(url) => {
              set('coverUrl', url)
              set('coverTheme', 'propia')
            }}
            onElegir={() => set('coverTheme', 'propia')}
          />
        </div>
      </div>

      <div className="tarjeta max-w-xl space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="etiqueta">{form.eventType === 'aniversario' ? 'Nombre de ella' : 'Nombre de la novia'}</label>
            <input value={form.brideName} onChange={update('brideName')} className="campo" />
          </div>
          <div>
            <label className="etiqueta">{form.eventType === 'aniversario' ? 'Nombre de él' : 'Nombre del novio'}</label>
            <input value={form.groomName} onChange={update('groomName')} className="campo" />
          </div>
        </div>
        <div>
          <label className="etiqueta">{form.eventType === 'aniversario' ? 'Fecha de la celebración' : 'Fecha de la boda'}</label>
          <input type="date" value={form.weddingDate} onChange={update('weddingDate')} className="campo" />
        </div>
        <div>
          <label className="etiqueta">Lugar</label>
          <input value={form.venue} onChange={update('venue')} className="campo" placeholder="Hacienda Los Ficus, Pachacámac" />
        </div>
        <div>
          <label className="etiqueta">Mensaje para sus invitados</label>
          <textarea
            value={form.coverMessage}
            onChange={update('coverMessage')}
            rows={4}
            className="campo"
            placeholder="Queremos compartir con ustedes el día más feliz de nuestras vidas…"
          />
        </div>
      </div>

      <div className="tarjeta max-w-xl space-y-5 p-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Fecha límite para confirmar</h2>
          <p className="text-xs text-cacao-500">Después de esa fecha sus invitados ya no podrán confirmar desde su link.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PLAZOS.map((p) => (
            <button
              key={p.dias}
              type="button"
              onClick={() => set('plazo', p.dias)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                Number(form.plazo) === p.dias ? 'border-terracota bg-terracota text-crema' : 'border-arena-300 bg-white text-cacao-700 hover:bg-arena'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="rounded-xl bg-crema px-4 py-3 text-sm text-cacao">
          {form.weddingDate ? (
            <>
              Sus invitados podrán confirmar hasta el <b>{fechaLarga(fechaLimite(form.weddingDate, Number(form.plazo)))}</b>.
            </>
          ) : (
            `Definan la fecha ${form.eventType === 'aniversario' ? 'de la celebración' : 'de la boda'} para calcular la fecha límite.`
          )}
        </p>
      </div>

      <div className="tarjeta max-w-xl space-y-4 p-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Avisos por WhatsApp</h2>
          <p className="text-xs text-cacao-500">
            Les avisaremos cuando alguien confirme o les regale algo. Este número es privado: sus invitados no lo ven.
          </p>
        </div>
        <div>
          <label className="etiqueta">Su WhatsApp</label>
          <input value={form.whatsapp} onChange={update('whatsapp')} className="campo" placeholder="9XX XXX XXX" />
        </div>
        <label className="flex items-center gap-2 text-sm text-cacao-700">
          <input type="checkbox" checked={form.avisar} onChange={(e) => set('avisar', e.target.checked)} className="h-4 w-4 accent-[#A8553A]" />
          Quiero recibir avisos por WhatsApp
        </label>
        <p className="text-[11px] text-cacao-500">Los avisos también aparecen siempre en su Resumen, en “Novedades”.</p>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primario">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span className="text-sm text-salvia">Guardado ✓ Volviendo al resumen…</span>}
        {error && <span className="text-sm text-terracota-800">{error}</span>}
      </div>
    </form>
  )
}
