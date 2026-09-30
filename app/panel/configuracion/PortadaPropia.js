'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import { comprimir, medidas } from '@/lib/imagenes'

// Subida de la foto de portada propia de los novios, con recomendaciones,
// validación de tamaño y vista previa de cómo se verá en su página.
export default function PortadaPropia({ coupleId, valor, activa, onSubida, onElegir, nombres }) {
  const supabase = createClient()
  const input = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [error, setError] = useState(null)

  async function subir(file) {
    if (!file) return
    setError(null)
    setAviso(null)
    if (!file.type.startsWith('image/')) return setError('El archivo debe ser una foto (JPG, PNG o WEBP).')
    if (file.size > 15 * 1024 * 1024) return setError('La foto pesa más de 15 MB. Elijan una más liviana.')

    setSubiendo(true)
    try {
      const { ancho, alto } = await medidas(file)
      const avisos = []
      if (alto > ancho) avisos.push('la foto es vertical: en computadora se recortará bastante arriba y abajo')
      if (ancho < 1600) avisos.push(`mide ${ancho} × ${alto} px, puede verse borrosa en pantallas grandes`)
      if (avisos.length) setAviso(`Ojo: ${avisos.join(' y ')}. Recomendamos una foto horizontal de al menos 1920 × 1080 px.`)

      const datos = await comprimir(file, 2400)
      const ruta = `${coupleId}/portada-${Date.now()}.jpg`
      const { error: err } = await supabase.storage.from('portadas').upload(ruta, datos, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      })
      if (err) throw err
      const { data } = supabase.storage.from('portadas').getPublicUrl(ruta)
      onSubida(data.publicUrl)
    } catch (e) {
      setError(e.message || 'No pudimos subir la foto. Intenten de nuevo.')
    } finally {
      setSubiendo(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="tarjeta space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-cacao">Su propia foto</h3>
          <p className="text-xs text-cacao-500">La foto de su pedida, de su sesión pre-boda o de un lugar especial para ustedes.</p>
        </div>
        {valor && (
          <button
            type="button"
            onClick={onElegir}
            className={`btn btn-sm ${activa ? 'bg-terracota text-crema' : 'btn-claro'}`}
          >
            {activa ? (
              <>
                <Icon name="check" className="h-4 w-4" /> Usando su foto
              </>
            ) : (
              'Usar esta foto'
            )}
          </button>
        )}
      </div>

      {/* Vista previa como en su página */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          subir(e.dataTransfer.files?.[0])
        }}
        className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl ${
          valor ? '' : 'border-2 border-dashed border-arena-300 bg-white'
        } ${activa ? 'ring-2 ring-terracota ring-offset-2 ring-offset-crema' : ''}`}
      >
        {valor ? (
          <>
            <img src={valor} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-cacao/40 via-cacao/25 to-cacao/60" />
            <div className="relative text-center text-white">
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/80">Nos casamos</p>
              <p className="mt-1 font-script text-4xl sm:text-5xl">{nombres}</p>
              <p className="mt-2 text-[10px] text-white/80">Así se verá la portada de su página</p>
            </div>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="btn btn-sm absolute bottom-3 right-3 bg-white/95 text-cacao hover:bg-white"
            >
              <Icon name="upload" className="h-4 w-4" /> Cambiar foto
            </button>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex flex-col items-center gap-2 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rubor-100 text-terracota">
              <Icon name="upload" className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-cacao">Arrastren su foto aquí o hagan clic para subirla</span>
            <span className="text-xs text-cacao-500">JPG, PNG o WEBP · hasta 15 MB</span>
          </button>
        )}
        {subiendo && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 text-sm font-medium text-cacao">Subiendo y optimizando su foto…</div>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />

      {aviso && <p className="rounded-xl bg-oro-100 px-4 py-3 text-xs text-cacao">{aviso}</p>}
      {error && <p className="rounded-xl bg-rubor-100 px-4 py-3 text-xs text-terracota-800">{error}</p>}

      <div className="rounded-xl bg-crema px-4 py-3 text-xs leading-relaxed text-cacao-700">
        <p className="mb-1 font-medium text-cacao">Recomendaciones para que se vea perfecta</p>
        <ul className="list-disc space-y-0.5 pl-4">
          <li><b>Horizontal</b> (apaisada), de al menos <b>1920 × 1080 px</b>. Ideal: 2400 × 1350 px (proporción 16:9).</li>
          <li>Ubíquense al <b>centro</b> de la foto: sus nombres y la fecha van encima, en el centro.</li>
          <li>En celular la foto se muestra vertical y se recortan los costados: que lo importante no quede en los bordes.</li>
          <li>Evitar fotos muy claras o con mucho detalle detrás del centro; oscurecemos un poco la imagen para que el texto se lea.</li>
          <li>No se preocupen por el peso: la optimizamos automáticamente para que cargue rápido.</li>
        </ul>
      </div>
    </div>
  )
}
