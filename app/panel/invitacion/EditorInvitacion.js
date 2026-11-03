'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import CampoHora from '@/components/CampoHora'
import Portada from '@/components/invitacion/Portadas'
import { Itinerario, DressCode } from '@/components/invitacion/Secciones'
import { SECCIONES, TEXTOS, aplicaA, PRECIO_PRO, MODELOS, modelo as buscarModelo, paleta as buscarPaleta, variablesTema, invitacionConDefectos, horaBonita, leerHora, textosEvento, partesFecha, iniciales } from '@/lib/temas'
import { CANCIONES } from '@/lib/musica'
import { escenario, linkWhatsApp } from '@/lib/escenarios'
import { comprimir } from '@/lib/imagenes'

const MAX_ITINERARIO = 12
const MAX_COLORES = 5

export default function EditorInvitacion({ couple, pro = null }) {
  const router = useRouter()
  const supabase = createClient()
  const [inv, setInv] = useState(() => invitacionConDefectos(couple.invite || {}, couple))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [sonando, setSonando] = useState(null)
  const [subiendo, setSubiendo] = useState(null)
  const [masivo, setMasivo] = useState({ abierto: false, texto: '', aviso: null }) // índice de la foto que se está subiendo
  const [proEstado, setProEstado] = useState(pro?.unlocked_at ? 'activo' : pro?.requested_at ? 'solicitado' : 'no')
  const audio = useRef(null)

  const m = buscarModelo(inv.modelo)
  const set = (campo, valor) => setInv((v) => ({ ...v, [campo]: valor }))

  function elegirModelo(id) {
    const nuevo = buscarModelo(id)
    setInv((v) => ({ ...v, modelo: id, paleta: nuevo.paletas[0].id, sobre: nuevo.sobrePorDefecto ? true : v.sobre }))
  }

  function probar(c) {
    const a = audio.current
    if (!a) return
    if (sonando === c.id) {
      a.pause()
      setSonando(null)
      return
    }
    a.src = c.url
    a.play().then(() => setSonando(c.id)).catch(() => setSonando(null))
  }

  // Itinerario
  const filas = inv.itinerario.length ? inv.itinerario : []
  const setFila = (i, campo, valor) => set('itinerario', filas.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)))
  const agregarFila = () => filas.length < MAX_ITINERARIO && set('itinerario', [...filas, { hora: '', titulo: '', lugar: '' }])
  const quitarFila = (i) => set('itinerario', filas.filter((_, j) => j !== i))

  // Carga masiva: una línea por momento → "hora | actividad | lugar"
  // (también sirve copiar 3 columnas desde Excel o Google Sheets).
  function cargarMasivo(reemplazar) {
    const nuevas = []
    const errores = []
    masivo.texto.split(/\r?\n/).forEach((linea, n) => {
      if (!linea.trim()) return
      const partes = linea.split(/\t|\||;/).map((x) => x.trim())
      let [hora, titulo, lugar] = partes
      let h = leerHora(hora)
      if (!h && partes.length === 1) {
        // Solo la actividad, o "4:00 pm Ceremonia" sin separador
        const m = linea.trim().match(/^(\d{1,2}(?:[:.]\d{2})?\s*(?:[ap]\.?\s?m\.?)?)\s+(.+)$/i)
        if (m && leerHora(m[1])) {
          h = leerHora(m[1])
          titulo = m[2]
        } else {
          titulo = linea.trim()
        }
        lugar = ''
      } else if (!h && hora) {
        errores.push(n + 1)
        return
      }
      if (!titulo) return errores.push(n + 1)
      nuevas.push({ hora: h, titulo: titulo.slice(0, 60), lugar: (lugar || '').slice(0, 80) })
    })
    const lista = [...(reemplazar ? [] : filas), ...nuevas].slice(0, MAX_ITINERARIO)
    set('itinerario', lista)
    setMasivo({
      abierto: errores.length > 0,
      texto: errores.length ? masivo.texto : '',
      aviso: `${nuevas.length} ${nuevas.length === 1 ? 'momento agregado' : 'momentos agregados'}${errores.length ? `. Revisa la hora en la(s) línea(s) ${errores.join(', ')}.` : '.'}`,
    })
  }

  // Dress code
  const colores = inv.dresscode.colores
  const setDress = (campo, valor) => set('dresscode', { ...inv.dresscode, [campo]: valor })

  async function subirFoto(i, file) {
    if (!file) return
    const esVideo = file.type.startsWith('video/')
    if (esVideo && i !== 0) return setError('El video va en la portada (primer recuadro).')
    if (!esVideo && !file.type.startsWith('image/')) return setError('El archivo debe ser una foto (JPG, PNG, WEBP) o un video corto (MP4, MOV).')
    setError(null)
    setSubiendo(i)
    try {
      let datos = file
      let ruta
      let tipo = file.type
      if (esVideo) {
        if (file.size > 30 * 1024 * 1024) throw new Error('El video pesa más de 30 MB. Usen uno más corto (máximo 15 segundos).')
        const dur = await duracionVideo(file)
        if (dur > 20) throw new Error(`El video dura ${Math.round(dur)} segundos. Recórtenlo a 15 segundos o menos.`)
        const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4'
        ruta = `${couple.id}/pro-video-${Date.now()}.${ext}`
      } else {
        datos = await comprimir(file, 2000)
        tipo = 'image/jpeg'
        ruta = `${couple.id}/pro-${i + 1}-${Date.now()}.jpg`
      }
      const { error: err } = await supabase.storage.from('portadas').upload(ruta, datos, { contentType: tipo, cacheControl: '31536000' })
      if (err) throw err
      const { data } = supabase.storage.from('portadas').getPublicUrl(ruta)
      if (esVideo) {
        set('video', data.publicUrl)
      } else {
        const fotos = [...inv.fotos]
        fotos[i] = data.publicUrl
        setInv((v) => ({ ...v, fotos, ...(i === 0 ? { video: '' } : {}) }))
      }
    } catch (e) {
      setError(e.message || 'No pudimos subir el archivo.')
    } finally {
      setSubiendo(null)
    }
  }

  function duracionVideo(file) {
    return new Promise((ok) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(v.src)
        ok(v.duration || 0)
      }
      v.onerror = () => ok(0)
      v.src = URL.createObjectURL(file)
    })
  }

  async function pedirPro() {
    const { error: err } = await supabase.rpc('solicitar_pro')
    if (err) return setError(err.message)
    setProEstado('solicitado')
    window.open(
      linkWhatsApp(
        `Hola Cherry Bloom Studio 💍 Quiero activar el diseño PRO "Historia en fotos" (${PRECIO_PRO}) para la invitación de ${couple.bride_name} y ${couple.groom_name} (${couple.slug}). ¿Cómo hago el pago?`
      ),
      '_blank'
    )
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    audio.current?.pause()
    const limpio = {
      modelo: inv.modelo,
      paleta: inv.paleta,
      frase: inv.frase.trim().slice(0, 160),
      hora: inv.hora,
      colores: inv.paleta === 'propia' ? inv.colores : undefined,
      musica: inv.musica,
      sobre: !!inv.sobre,
      itinerario: filas
        .filter((f) => f.titulo?.trim())
        .map((f) => ({ hora: f.hora || '', titulo: f.titulo.trim().slice(0, 60), lugar: (f.lugar || '').trim().slice(0, 80) })),
      dresscode: { texto: inv.dresscode.texto.trim().slice(0, 80), colores },
      hospedaje: inv.hospedaje.trim().slice(0, 500),
      fotos: inv.fotos,
      video: inv.video,
      contacto: inv.contacto.trim().slice(0, 80),
      mostrar: inv.mostrar,
      textos: Object.fromEntries(Object.entries(inv.textos).map(([k, v]) => [k, (v || '').trim().slice(0, 120)])),
    }
    const { error: err } = await supabase.from('couples').update({ invite: limpio }).eq('id', couple.id)
    setGuardando(false)
    if (err) return setError(err.message)
    router.push('/panel?listo=invitacion')
    router.refresh()
  }

  const t0 = textosEvento(couple)
  const t = inv.textos?.saludo ? { ...t0, eyebrow: inv.textos.saludo } : t0
  const fotoPropia = couple.cover_theme === 'propia' && couple.cover_url ? couple.cover_url : null
  const demoInvitacion = { name: 'Familia Rodríguez', passes: 4, status: 'pendiente' }
  const coupleVista = { ...couple, bride_name: couple.bride_name || 'Novia', groom_name: couple.groom_name || 'Novio' }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-8">
        {/* Modelo */}
        <section className="tarjeta p-6">
          <h2 className="font-serif text-2xl font-semibold">1. Modelo</h2>
          <p className="mb-4 text-xs text-cacao-500">Todos son gratis, menos los marcados PRO. Pueden cambiarlo cuando quieran.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MODELOS.map((mo) => {
              const p = mo.paletas[0]
              const activo = inv.modelo === mo.id
              return (
                <button
                  key={mo.id}
                  type="button"
                  onClick={() => elegirModelo(mo.id)}
                  aria-pressed={activo}
                  className={`relative overflow-hidden rounded-2xl border text-left transition ${activo ? 'border-terracota ring-2 ring-terracota' : 'border-arena-200 hover:border-arena-300'}`}
                >
                  <div
                    className="flex h-28 flex-col items-center justify-center gap-1"
                    style={{
                      background: mo.id === 'clasica' ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.45)), url(${escenario(couple.cover_theme).mini}) center/cover` : mo.pro ? p.soft : mo.base.bg,
                      color: mo.id === 'clasica' || mo.pro ? '#fff' : mo.base.text,
                    }}
                  >
                    {mo.id === 'andino' && <span className="absolute inset-x-0 top-0 h-2.5" style={{ background: `repeating-linear-gradient(90deg, ${p.accent} 0 14px, #E3A82B 14px 20px, #1F7A72 20px 26px)` }} />}
                    <span className="text-3xl leading-none" style={mo.pro ? { fontFamily: mo.script, color: '#5A4413', background: 'radial-gradient(circle at 35% 30%, #F4DE96, #B8963E 55%, #7A5E1F)', borderRadius: 999, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 } : { fontFamily: mo.script, color: mo.id === 'clasica' ? '#fff' : p.accent }}>
                      {mo.pro ? `${(couple.bride_name || 'A')[0]}${(couple.groom_name || 'B')[0]}` : `${(couple.bride_name || 'A')[0]} & ${(couple.groom_name || 'B')[0]}`}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.25em] opacity-80" style={{ fontFamily: mo.display }}>
                      {t.aniversario ? 'Aniversario' : 'Nos casamos'}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-cacao">
                      {mo.nombre}
                      {mo.pro && <span className="rounded-full bg-cacao px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-oro-300">PRO</span>}
                    </p>
                    <p className="line-clamp-2 text-[11px] leading-snug text-cacao-500">{mo.descripcion}</p>
                  </div>
                  {activo && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-terracota text-white">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {inv.modelo === 'clasica' && (
            <p className="mt-3 text-xs text-cacao-500">La foto de fondo se elige en “Nuestra página” (escenario o su propia foto).</p>
          )}
          {inv.modelo !== 'clasica' && fotoPropia && (
            <p className="mt-3 text-xs text-cacao-500">Su foto aparecerá enmarcada debajo de la portada.</p>
          )}
        </section>

        {/* Diseño PRO */}
        {m.pro && (
          <section className="tarjeta space-y-5 border-oro-300 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-semibold">Diseño PRO · {PRECIO_PRO}</h2>
                <p className="text-xs text-cacao-500">Pago único por su celebración. Pueden probarlo y verlo aquí antes de pagar.</p>
              </div>
              {proEstado === 'activo' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-salvia-100 px-3 py-1.5 text-sm font-medium text-salvia">
                  <Icon name="check" className="h-4 w-4" /> PRO activo
                </span>
              ) : proEstado === 'solicitado' ? (
                <button type="button" onClick={pedirPro} className="btn-claro btn-sm">
                  Solicitud enviada · escribir de nuevo
                </button>
              ) : (
                <button type="button" onClick={pedirPro} className="btn-primario btn-sm">
                  Activar PRO por {PRECIO_PRO}
                </button>
              )}
            </div>
            {proEstado !== 'activo' && (
              <p className="rounded-xl bg-oro-100 px-4 py-3 text-sm text-cacao">
                Mientras no esté activo, sus invitados verán el modelo <b>Clásica con foto</b>. Al confirmar su pago lo activamos y la
                invitación cambia sola.
              </p>
            )}
            <div>
              <p className="etiqueta">Portada (video corto o foto) y foto de “Los detalles”</p>
              <div className="grid max-w-md grid-cols-2 gap-3">
                {[0, 1].map((i) => {
                  const video = i === 0 && inv.video
                  const tiene = video || inv.fotos[i]
                  return (
                    <div key={i} className="space-y-1.5">
                      <label className="relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-arena-300 bg-white text-center hover:border-terracota">
                        {video ? (
                          <video src={inv.video} muted autoPlay loop playsInline className="absolute inset-0 h-full w-full object-cover" />
                        ) : inv.fotos[i] ? (
                          <img src={inv.fotos[i]} alt={`Foto ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <span className="px-3 text-xs text-cacao-500">
                            <Icon name="upload" className="mx-auto mb-2 h-6 w-6 text-terracota" />
                            {i === 0 ? 'Video corto o foto de portada' : 'Foto de “Los detalles”'}
                          </span>
                        )}
                        {subiendo === i && <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-cacao">Subiendo…</span>}
                        {tiene && subiendo !== i && (
                          <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/55 py-1 text-[11px] text-white">{video ? 'Cambiar video' : 'Cambiar'}</span>
                        )}
                        <input type="file" accept={i === 0 ? 'image/*,video/mp4,video/quicktime,video/webm' : 'image/*'} className="sr-only" onChange={(e) => subirFoto(i, e.target.files?.[0])} />
                      </label>
                      {video && (
                        <button type="button" onClick={() => set('video', '')} className="w-full text-[11px] text-cacao-500 underline hover:text-terracota">
                          Quitar video (usar foto)
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-cacao-500">Video: vertical, de 5 a 15 segundos (MP4 o MOV, máx. 30 MB); se reproduce en bucle y sin sonido, la música sigue sonando. Fotos: verticales, de al menos 1080 × 1600 px. Si no suben nada, usamos paisajes de ejemplo.</p>
            </div>
            <div>
              <label className="etiqueta" htmlFor="contacto">
                Contacto para el RSVP (opcional)
              </label>
              <input id="contacto" value={inv.contacto} maxLength={80} onChange={(e) => set('contacto', e.target.value)} className="campo" placeholder="WhatsApp 987 654 321" />
            </div>
          </section>
        )}

        {/* Color */}
        <section className="tarjeta p-6">
          <h2 className="font-serif text-2xl font-semibold">2. Color</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {m.paletas.map((p) => {
              const activo = inv.paleta === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set('paleta', p.id)}
                  aria-pressed={activo}
                  className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition ${activo ? 'border-terracota bg-rubor-100 text-terracota-800' : 'border-arena-300 bg-white text-cacao-700 hover:bg-arena'}`}
                >
                  <span className="flex h-8 w-8 overflow-hidden rounded-full border border-black/10">
                    <span className="h-full w-1/2" style={{ background: p.accent }} />
                    <span className="h-full w-1/2" style={{ background: p.soft }} />
                  </span>
                  {p.nombre}
                </button>
              )
            })}
            {m.personalizable && (
              <button
                type="button"
                onClick={() => set('paleta', 'propia')}
                aria-pressed={inv.paleta === 'propia'}
                className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition ${inv.paleta === 'propia' ? 'border-terracota bg-rubor-100 text-terracota-800' : 'border-dashed border-arena-300 bg-white text-cacao-700 hover:bg-arena'}`}
              >
                <span className="flex h-8 w-8 overflow-hidden rounded-full border border-black/10" style={{ background: 'conic-gradient(#e8b4b0, #f2c48d, #c9d6b8, #b9c8e0, #d9b8d6, #e8b4b0)' }} />
                Personalizada
              </button>
            )}
          </div>
          {m.personalizable && inv.paleta === 'propia' && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['soft', 'Sobre y fondos'],
                ['accent', 'Sello y detalles'],
                ['boton', 'Botones'],
              ].map(([k, l]) => (
                <label key={k} className="flex items-center gap-3 rounded-2xl border border-arena-200 bg-white/70 p-3">
                  <input
                    type="color"
                    value={inv.colores[k]}
                    onChange={(e) => set('colores', { ...inv.colores, [k]: e.target.value })}
                    className="h-11 w-11 shrink-0 cursor-pointer rounded-full border border-arena-300 bg-white p-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-cacao">{l}</span>
                    <span className="block font-mono text-[11px] uppercase text-cacao-500">{inv.colores[k]}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Textos */}
        <section className="tarjeta space-y-5 p-6">
          <h2 className="font-serif text-2xl font-semibold">3. Textos de la portada</h2>
          <div>
            <label className="etiqueta" htmlFor="frase">
              Frase de bienvenida (opcional)
            </label>
            <input
              id="frase"
              value={inv.frase}
              maxLength={160}
              onChange={(e) => set('frase', e.target.value)}
              className="campo"
              placeholder={t.aniversario ? 'Veinticinco años después, queremos renovar nuestros votos con ustedes.' : 'Y en medio de todo, nos encontramos.'}
            />
            <p className="mt-1 text-[11px] text-cacao-500">Si la dejan vacía, usamos una frase propia del modelo.</p>
          </div>
          <div>
            <label className="etiqueta" htmlFor="hora">
              Hora de inicio
            </label>
            <CampoHora id="hora" etiqueta="Hora de inicio" value={inv.hora} onChange={(v) => set('hora', v)} />
            {inv.hora && <p className="mt-1 text-[11px] text-cacao-500">En la invitación se verá: {horaBonita(inv.hora)}</p>}
          </div>
          <p className="text-xs text-cacao-500">
            Nombres, fecha, lugar y el mensaje largo se editan en <a href="/panel/configuracion" className="text-terracota underline">Nuestra página</a>.
          </p>
        </section>

        {/* Sobre y música */}
        <section className="tarjeta space-y-5 p-6">
          <h2 className="font-serif text-2xl font-semibold">4. Sobre y música</h2>
          <label className="flex items-start gap-3 rounded-2xl border border-arena-200 bg-white/70 p-4">
            <input type="checkbox" checked={inv.sobre} onChange={(e) => set('sobre', e.target.checked)} className="mt-1 h-4 w-4 accent-[#A8553A]" />
            <span>
              <span className="block text-sm font-medium text-cacao">Abrir con un sobre</span>
              <span className="block text-xs text-cacao-500">
                El invitado ve un sobre con sus iniciales ({iniciales(couple)}) y “Para: su nombre”. Al tocar el sello se abre la invitación y empieza la música.
              </span>
            </span>
          </label>

          <div>
            <p className="etiqueta">Música de fondo</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => set('musica', '')}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm ${!inv.musica ? 'border-terracota bg-rubor-100' : 'border-arena-300 bg-white'}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-arena text-cacao-500">
                  <Icon name="x" className="h-4 w-4" />
                </span>
                Sin música
              </button>
              {CANCIONES.map((c) => {
                const activa = inv.musica === c.id
                return (
                  <div key={c.id} className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${activa ? 'border-terracota bg-rubor-100' : 'border-arena-300 bg-white'}`}>
                    <button
                      type="button"
                      onClick={() => probar(c)}
                      aria-label={sonando === c.id ? `Pausar ${c.nombre}` : `Escuchar ${c.nombre}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracota text-white"
                    >
                      <Icon name={sonando === c.id ? 'pause' : 'play'} className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => set('musica', c.id)} className="min-w-0 flex-1 py-1 text-left">
                      <span className="block truncate text-sm font-medium text-cacao">{c.nombre}</span>
                      <span className="block text-[11px] text-cacao-500">{c.estilo}</span>
                    </button>
                    {activa && <Icon name="check" className="mr-1 h-4 w-4 text-terracota" />}
                  </div>
                )
              })}
            </div>
            <audio ref={audio} onEnded={() => setSonando(null)} preload="none" />
          </div>
        </section>

        {/* Itinerario */}
        <section className="tarjeta space-y-4 p-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold">5. Itinerario (opcional)</h2>
            <p className="text-xs text-cacao-500">Ceremonia, cóctel, cena, fiesta… hasta {MAX_ITINERARIO} momentos.</p>
          </div>
          {filas.map((f, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-2xl border border-arena-200 bg-white/60 p-2">
              <CampoHora etiqueta={`Hora del momento ${i + 1}`} value={f.hora} onChange={(v) => setFila(i, 'hora', v)} />
              <input aria-label="Momento" value={f.titulo} maxLength={60} onChange={(e) => setFila(i, 'titulo', e.target.value)} className="campo min-w-[160px] flex-1" placeholder="Ceremonia" />
              <button type="button" onClick={() => quitarFila(i)} aria-label="Quitar momento" className="flex h-11 w-11 items-center justify-center rounded-xl text-cacao-500 hover:bg-rubor-100 hover:text-terracota-800">
                <Icon name="trash" className="h-4 w-4" />
              </button>
              <input aria-label="Lugar" value={f.lugar} maxLength={80} onChange={(e) => setFila(i, 'lugar', e.target.value)} className="campo w-full" placeholder="Lugar (opcional)" />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {filas.length < MAX_ITINERARIO && (
              <button type="button" onClick={agregarFila} className="btn-claro btn-sm">
                <Icon name="plus" className="h-4 w-4" /> Agregar momento
              </button>
            )}
            <button type="button" onClick={() => setMasivo((v) => ({ ...v, abierto: !v.abierto, aviso: null }))} className="btn-claro btn-sm">
              <Icon name="copy" className="h-4 w-4" /> Pegar varios a la vez
            </button>
          </div>
          {masivo.aviso && <p className="text-sm text-salvia">{masivo.aviso}</p>}
          {masivo.abierto && (
            <div className="space-y-3 rounded-2xl border border-arena-200 bg-crema p-4">
              <p className="text-sm text-cacao">
                Escriban <b>un momento por línea</b>: <code className="rounded bg-white px-1.5 py-0.5 text-xs">hora | actividad | lugar</code>. El lugar es
                opcional. También pueden copiar 3 columnas desde Excel o Google Sheets y pegarlas aquí.
              </p>
              <textarea
                rows={6}
                value={masivo.texto}
                onChange={(e) => setMasivo((v) => ({ ...v, texto: e.target.value }))}
                className="campo font-mono text-xs"
                placeholder={'4:00 pm | Ceremonia religiosa | Capilla de la hacienda\n5:30 pm | Cóctel de bienvenida | Jardín\n7:00 pm | Recepción y cena | Salón principal\n9:00 pm | Primer baile\n10:00 pm | Fiesta'}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => cargarMasivo(false)} disabled={!masivo.texto.trim()} className="btn-primario btn-sm">
                  Agregar a la lista
                </button>
                <button type="button" onClick={() => cargarMasivo(true)} disabled={!masivo.texto.trim()} className="btn-claro btn-sm">
                  Reemplazar la lista
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Dress code y hospedaje */}
        <section className="tarjeta space-y-5 p-6">
          <h2 className="font-serif text-2xl font-semibold">6. Dress code y hospedaje (opcional)</h2>
          <div>
            <label className="etiqueta" htmlFor="dress">
              Dress code
            </label>
            <input id="dress" value={inv.dresscode.texto} maxLength={80} onChange={(e) => setDress('texto', e.target.value)} className="campo" placeholder="Formal de jardín · todo menos blanco" />
          </div>
          <div>
            <p className="etiqueta">Paleta sugerida para los invitados</p>
            <div className="flex flex-wrap items-center gap-2">
              {colores.map((col, i) => (
                <span key={i} className="relative">
                  <input
                    type="color"
                    aria-label={`Color ${i + 1}`}
                    value={col}
                    onChange={(e) => setDress('colores', colores.map((c, j) => (j === i ? e.target.value : c)))}
                    className="h-11 w-11 cursor-pointer rounded-full border border-arena-300 bg-white p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setDress('colores', colores.filter((_, j) => j !== i))}
                    aria-label="Quitar color"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cacao text-white"
                  >
                    <Icon name="x" className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {colores.length < MAX_COLORES && (
                <button
                  type="button"
                  onClick={() => setDress('colores', [...colores, buscarPaleta(m, inv.paleta).soft])}
                  className="flex h-11 items-center gap-1.5 rounded-full border border-dashed border-arena-300 px-3 text-xs text-cacao-700 hover:bg-arena"
                >
                  <Icon name="plus" className="h-3.5 w-3.5" /> Color
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="etiqueta" htmlFor="hospedaje">
              Hospedaje cercano (para invitados que vienen de lejos)
            </label>
            <textarea
              id="hospedaje"
              rows={3}
              value={inv.hospedaje}
              maxLength={500}
              onChange={(e) => set('hospedaje', e.target.value)}
              className="campo"
              placeholder={'Hotel Pachacámac Lodge (10 min)\nCasa Andina Select (25 min)'}
            />
          </div>
        </section>

        {/* Qué mostrar y textos */}
        <section className="tarjeta space-y-5 p-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold">7. Qué mostrar y textos</h2>
            <p className="text-xs text-cacao-500">Apaguen lo que no quieran en su invitación y cambien los textos fijos. Vacío = texto del modelo.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SECCIONES.filter((x) => aplicaA(x, m.id)).map((x) => (
              <label key={x.id} className="flex items-center justify-between gap-3 rounded-xl border border-arena-200 bg-white/70 px-4 py-3">
                <span className="text-sm text-cacao">{x.nombre}</span>
                <input
                  type="checkbox"
                  checked={inv.mostrar[x.id] !== false}
                  onChange={(e) => set('mostrar', { ...inv.mostrar, [x.id]: e.target.checked })}
                  className="h-5 w-5 accent-[#A8553A]"
                />
              </label>
            ))}
          </div>
          <div className="space-y-3">
            {TEXTOS.filter((x) => aplicaA(x, m.id)).map((x) => (
              <div key={x.id}>
                <label className="etiqueta" htmlFor={`txt-${x.id}`}>
                  {x.nombre}
                </label>
                <input
                  id={`txt-${x.id}`}
                  value={inv.textos[x.id] || ''}
                  maxLength={120}
                  onChange={(e) => set('textos', { ...inv.textos, [x.id]: e.target.value })}
                  className="campo"
                  placeholder={x.ejemplo}
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-cacao-500">El hospedaje solo aparece si escriben algo en “Hospedaje cercano” (sección 6).</p>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={guardar} disabled={guardando} className="btn-primario">
            {guardando ? 'Guardando…' : 'Guardar mi invitación'}
          </button>
          {error && <span className="text-sm text-terracota-800">{error}</span>}
        </div>
      </div>

      {/* Vista previa en vivo */}
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-cacao-500">Vista previa · así la ve su invitado</p>
        <div className="mx-auto w-[360px] max-w-full overflow-hidden rounded-[36px] border-[10px] border-cacao bg-cacao shadow-suave">
          <div className="tema vista-previa h-[640px] overflow-y-auto" data-modelo={m.id} style={variablesTema(m.id, inv.paleta, inv.colores)}>
            {m.id === 'historia' && inv.sobre && (
              <div className="relative flex h-[640px] flex-col items-center justify-center gap-5 text-center" style={{ background: 'var(--t-soft)' }}>
                <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  <path d="M0 0 L50 50 L0 100 M100 0 L50 50 L100 100" fill="none" stroke="rgba(0,0,0,.14)" strokeWidth="0.4" />
                  <path d="M50 0 V100" stroke="rgba(0,0,0,.18)" strokeWidth="0.4" />
                </svg>
                <p className="relative text-sm tracking-[0.2em] text-white/90" style={{ fontFamily: 'var(--t-display)' }}>
                  FAMILIA RODRÍGUEZ
                </p>
                <span
                  className="relative flex h-24 w-24 items-center justify-center rounded-full text-2xl"
                  style={{ background: 'radial-gradient(circle at 35% 30%, #F4DE96, var(--t-accent) 55%, #7A5E1F)', color: '#5A4413', fontFamily: 'var(--t-script)', boxShadow: '0 10px 24px rgba(0,0,0,.35)' }}
                >
                  {iniciales(couple).replace('&', '')}
                </span>
                <p className="relative text-[10px] uppercase tracking-[0.3em] text-white/80">Sobre de apertura · baja para ver más</p>
              </div>
            )}
            <Portada
              c={coupleVista}
              t={t}
              f={partesFecha(couple.wedding_date)}
              inv={{ ...inv, horaTexto: horaBonita(inv.hora) }}
              invitacion={demoInvitacion}
              hayRegalos={couple.gifts_enabled !== false}
              portadaUrl={fotoPropia || escenario(couple.cover_theme).url}
              iniciales={iniciales(couple)}
            />
            {inv.mostrar.itinerario && m.id !== 'historia' && <Itinerario items={inv.itinerario.filter((x) => x.titulo)} />}
            {inv.mostrar.dresscode && <DressCode dresscode={inv.dresscode} />}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-cacao-500">Ejemplo con “Familia Rodríguez · 4 pases”.</p>
      </aside>
    </div>
  )
}
