'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/Icon'
import Portada from '@/components/invitacion/Portadas'
import { MODELOS, modelo as buscarModelo, paleta as buscarPaleta, variablesTema, invitacionConDefectos, textosEvento, partesFecha, iniciales } from '@/lib/temas'
import { CANCIONES } from '@/lib/musica'
import { escenario } from '@/lib/escenarios'

const MAX_ITINERARIO = 8
const MAX_COLORES = 5

export default function EditorInvitacion({ couple }) {
  const router = useRouter()
  const supabase = createClient()
  const [inv, setInv] = useState(() => invitacionConDefectos(couple.invite || {}, couple))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [sonando, setSonando] = useState(null)
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

  // Dress code
  const colores = inv.dresscode.colores
  const setDress = (campo, valor) => set('dresscode', { ...inv.dresscode, [campo]: valor })

  async function guardar() {
    setGuardando(true)
    setError(null)
    audio.current?.pause()
    const limpio = {
      modelo: inv.modelo,
      paleta: inv.paleta,
      frase: inv.frase.trim().slice(0, 160),
      hora: inv.hora,
      musica: inv.musica,
      sobre: !!inv.sobre,
      itinerario: filas
        .filter((f) => f.titulo?.trim())
        .map((f) => ({ hora: f.hora || '', titulo: f.titulo.trim().slice(0, 60), lugar: (f.lugar || '').trim().slice(0, 80) })),
      dresscode: { texto: inv.dresscode.texto.trim().slice(0, 80), colores },
      hospedaje: inv.hospedaje.trim().slice(0, 500),
    }
    const { error: err } = await supabase.from('couples').update({ invite: limpio }).eq('id', couple.id)
    setGuardando(false)
    if (err) return setError(err.message)
    router.push('/panel?listo=invitacion')
    router.refresh()
  }

  const t = textosEvento(couple)
  const fotoPropia = couple.cover_theme === 'propia' && couple.cover_url ? couple.cover_url : null
  const demoInvitacion = { name: 'Familia Rodríguez', passes: 4, status: 'pendiente' }
  const coupleVista = { ...couple, bride_name: couple.bride_name || 'Novia', groom_name: couple.groom_name || 'Novio' }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-8">
        {/* Modelo */}
        <section className="tarjeta p-6">
          <h2 className="font-serif text-2xl font-semibold">1. Modelo</h2>
          <p className="mb-4 text-xs text-cacao-500">Todos son gratis. Pueden cambiarlo cuando quieran.</p>
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
                      background: mo.id === 'clasica' ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.45)), url(${escenario(couple.cover_theme).mini}) center/cover` : mo.base.bg,
                      color: mo.id === 'clasica' ? '#fff' : mo.base.text,
                    }}
                  >
                    {mo.id === 'andino' && <span className="absolute inset-x-0 top-0 h-2.5" style={{ background: `repeating-linear-gradient(90deg, ${p.accent} 0 14px, #E3A82B 14px 20px, #1F7A72 20px 26px)` }} />}
                    <span className="text-3xl leading-none" style={{ fontFamily: mo.script, color: mo.id === 'clasica' ? '#fff' : p.accent }}>
                      {(couple.bride_name || 'A')[0]} &amp; {(couple.groom_name || 'B')[0]}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.25em] opacity-80" style={{ fontFamily: mo.display }}>
                      {t.aniversario ? 'Aniversario' : 'Nos casamos'}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5">
                    <p className="text-sm font-medium text-cacao">{mo.nombre}</p>
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
          </div>
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
          <div className="max-w-[200px]">
            <label className="etiqueta" htmlFor="hora">
              Hora de inicio
            </label>
            <input id="hora" type="time" value={inv.hora} onChange={(e) => set('hora', e.target.value)} className="campo" />
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
            <div key={i} className="grid grid-cols-[132px_minmax(0,1fr)_44px] gap-2 rounded-2xl border border-arena-200 bg-white/60 p-2">
              <input type="time" aria-label="Hora" value={f.hora} onChange={(e) => setFila(i, 'hora', e.target.value)} className="campo" />
              <input aria-label="Momento" value={f.titulo} maxLength={60} onChange={(e) => setFila(i, 'titulo', e.target.value)} className="campo" placeholder="Ceremonia" />
              <button type="button" onClick={() => quitarFila(i)} aria-label="Quitar momento" className="flex h-11 items-center justify-center rounded-xl text-cacao-500 hover:bg-rubor-100 hover:text-terracota-800">
                <Icon name="trash" className="h-4 w-4" />
              </button>
              <input aria-label="Lugar" value={f.lugar} maxLength={80} onChange={(e) => setFila(i, 'lugar', e.target.value)} className="campo col-span-2" placeholder="Lugar (opcional)" />
            </div>
          ))}
          {filas.length < MAX_ITINERARIO && (
            <button type="button" onClick={agregarFila} className="btn-claro btn-sm">
              <Icon name="plus" className="h-4 w-4" /> Agregar momento
            </button>
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
          <div className="tema vista-previa h-[640px] overflow-y-auto" data-modelo={m.id} style={variablesTema(m.id, inv.paleta)}>
            <Portada
              c={coupleVista}
              t={t}
              f={partesFecha(couple.wedding_date)}
              inv={inv}
              invitacion={demoInvitacion}
              hayRegalos={couple.gifts_enabled !== false}
              portadaUrl={fotoPropia || escenario(couple.cover_theme).url}
              iniciales={iniciales(couple)}
            />
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-cacao-500">Ejemplo con “Familia Rodríguez · 4 pases”.</p>
      </aside>
    </div>
  )
}
