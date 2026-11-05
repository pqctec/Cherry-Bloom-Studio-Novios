'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------
// Todo se guarda en METROS; la pantalla lo convierte a píxeles con "escala".
// Las posiciones son el CENTRO de cada elemento.
// ---------------------------------------------------------------------
const CAP = 10 // asientos por defecto de una mesa
const MESA_D = 1.8 // diámetro de la mesa
const SILLA = 0.4 // grosor del anillo de sillas
const R_EXT = MESA_D / 2 + SILLA // radio total (mesa + sillas)

const clamp = (n, a, b) => Math.min(b, Math.max(a, n))
const r2 = (n) => Math.round(n * 100) / 100
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)
const nuevoId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

const FIJOS = ['dance', 'head', 'buffet']

function medidas(l, key) {
  if (FIJOS.includes(key)) return { w: l[key].w, l: l[key].l }
  return { w: R_EXT * 2, l: R_EXT * 2 }
}

function posDe(l, key) {
  if (FIJOS.includes(key)) return l[key]
  return l.tables.find((t) => t.id === key)
}

function limitar(l, key, x, y) {
  const m = medidas(l, key)
  return {
    x: r2(clamp(x, m.w / 2, Math.max(m.w / 2, l.venue.w - m.w / 2))),
    y: r2(clamp(y, m.l / 2, Math.max(m.l / 2, l.venue.l - m.l / 2))),
  }
}

// Si cambian las medidas del salón, nada debe quedar fuera del recuadro.
function reajustar(l) {
  const out = { ...l }
  for (const k of FIJOS) out[k] = { ...l[k], ...limitar(l, k, l[k].x, l[k].y) }
  out.tables = l.tables.map((t) => ({ ...t, ...limitar(l, t.id, t.x, t.y) }))
  return out
}

// Primer lugar libre (sin chocar con otras mesas, la pista, novios o buffet).
function puestoLibre(l) {
  const obst = FIJOS.map((k) => {
    const e = l[k]
    return { x0: e.x - e.w / 2, x1: e.x + e.w / 2, y0: e.y - e.l / 2, y1: e.y + e.l / 2 }
  })
  for (let y = R_EXT + 3; y <= l.venue.l - R_EXT; y += 0.5) {
    for (let x = R_EXT; x <= l.venue.w - R_EXT; x += 0.5) {
      const libreDeMesas = l.tables.every((t) => Math.hypot(t.x - x, t.y - y) >= R_EXT * 2 + 0.1)
      const libreDeZonas = obst.every((b) => !(x + R_EXT > b.x0 && x - R_EXT < b.x1 && y + R_EXT > b.y0 && y - R_EXT < b.y1))
      if (libreDeMesas && libreDeZonas) return { x: r2(x), y: r2(y) }
    }
  }
  return { x: r2(l.venue.w / 2), y: r2(l.venue.l / 2) }
}

function siguienteNumero(l) {
  const nums = l.tables.map((t) => parseInt((t.name.match(/\d+/) || [])[0], 10)).filter(Number.isFinite)
  return (nums.length ? Math.max(...nums) : l.tables.length) + 1
}

function nombreMesa(n) {
  return `Mesa ${String(n).padStart(2, '0')}`
}

function crearInicial(personas) {
  const venue = { w: 16, l: 24 }
  let l = {
    venue,
    dance: { w: 6, l: 8, x: venue.w / 2, y: 13 },
    head: { w: 4, l: 1.4, x: venue.w / 2, y: 1.5 },
    buffet: { w: 4.5, l: 1.2, x: venue.w - 3.2, y: 1.5 },
    tables: [],
    seats: {},
    modo: 'esperados',
  }
  const n = clamp(Math.ceil(personas / CAP), 6, 40)
  for (let i = 1; i <= n; i++) {
    const p = puestoLibre(l)
    l = { ...l, tables: [...l.tables, { id: nuevoId(), name: nombreMesa(i), label: '', x: p.x, y: p.y, cap: CAP }] }
  }
  return l
}

// Lo guardado (o importado) nunca se usa sin revisar.
function normalizar(raw, personas) {
  if (!raw || typeof raw !== 'object' || !raw.venue) return crearInicial(personas)
  const w = clamp(num(raw.venue?.w, 16), 6, 60)
  const lg = clamp(num(raw.venue?.l, 24), 6, 80)
  const el = (k, dw, dl, dx, dy, minW = 1, maxW = 40) => ({
    w: clamp(num(raw[k]?.w, dw), minW, maxW),
    l: clamp(num(raw[k]?.l, dl), minW, maxW),
    x: num(raw[k]?.x, dx),
    y: num(raw[k]?.y, dy),
  })
  const tables = (Array.isArray(raw.tables) ? raw.tables : []).slice(0, 80).map((t, i) => ({
    id: String(t.id || nuevoId()),
    name: String(t.name || nombreMesa(i + 1)).slice(0, 30),
    label: String(t.label || '').slice(0, 40),
    x: num(t.x, 5),
    y: num(t.y, 5),
    cap: clamp(Math.round(num(t.cap, CAP)), 1, 20),
  }))
  const seats = {}
  if (raw.seats && typeof raw.seats === 'object') {
    for (const [k, v] of Object.entries(raw.seats)) if (typeof v === 'string') seats[k] = v
  }
  return reajustar({
    venue: { w, l: lg },
    dance: el('dance', 6, 8, w / 2, lg / 2, 2),
    head: el('head', 4, 1.4, w / 2, 1.5),
    buffet: el('buffet', 4.5, 1.2, w - 3.2, 1.5),
    tables,
    seats,
    modo: raw.modo === 'confirmados' ? 'confirmados' : 'esperados',
  })
}

// Cuántas sillas necesita una invitación.
function asientosDe(inv, modo) {
  if (inv.status === 'no_asiste') return 0
  if (inv.status === 'confirmado') return inv.attending
  return modo === 'esperados' ? inv.passes : 0
}

const ESTADO_MESA = {
  vacia: 'border-cacao-300 bg-white',
  parcial: 'border-oro bg-oro-100',
  llena: 'border-salvia bg-salvia-100',
  exceso: 'border-terracota bg-rubor-100',
}
function estadoMesa(ocup, cap) {
  if (ocup > cap) return 'exceso'
  if (ocup === cap) return 'llena'
  return ocup > 0 ? 'parcial' : 'vacia'
}

// Campo numérico que no recorta mientras se escribe: valida al salir.
function NumCampo({ valor, min, max, onCommit, label }) {
  const [t, setT] = useState(String(valor))
  useEffect(() => setT(String(valor)), [valor])
  function fin() {
    const n = Number(String(t).replace(',', '.'))
    if (!Number.isFinite(n) || t.trim() === '') return setT(String(valor))
    const v = clamp(n, min, max)
    setT(String(v))
    onCommit(v)
  }
  return (
    <div>
      <label className="etiqueta">{label}</label>
      <input
        className="campo"
        inputMode="decimal"
        value={t}
        onChange={(e) => setT(e.target.value)}
        onBlur={fin}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </div>
  )
}

export default function Croquis({ couple, invitaciones, guardado, tablaFaltante }) {
  const supabase = createClient()
  const personasIniciales = useMemo(
    () => invitaciones.reduce((s, i) => s + asientosDe(i, 'esperados'), 0),
    [invitaciones]
  )
  const [layout, setLayout] = useState(() => normalizar(guardado, personasIniciales))
  const [sel, setSel] = useState(null)
  const [tab, setTab] = useState('salon')
  const [sucio, setSucio] = useState(!guardado)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(tablaFaltante ? { tipo: 'error', texto: 'Falta ejecutar la migración 16 en Supabase: todavía no se puede guardar el croquis.' } : null)
  const [escala, setEscala] = useState(26)
  const wrapRef = useRef(null)
  const drag = useRef(null)
  const archivoRef = useRef(null)

  // Escala responsive: 1 metro = N píxeles según el ancho disponible.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const calc = () => setEscala(clamp((el.clientWidth - 32) / layout.venue.w, 10, 30))
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [layout.venue.w])

  // Avisar si cierran la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sucio) return
    const f = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [sucio])

  // ---------------- datos derivados ----------------
  const { lista, ocupacion, idsMesas, sinMesa, sentadas, totalPersonas, capacidad } = useMemo(() => {
    const lista = invitaciones
      .map((i) => ({ ...i, n: asientosDe(i, layout.modo) }))
      .filter((i) => i.n > 0)
    const idsMesas = new Set(layout.tables.map((t) => t.id))
    const ocupacion = {}
    layout.tables.forEach((t) => (ocupacion[t.id] = 0))
    let sentadas = 0
    const sinMesa = []
    for (const i of lista) {
      const m = layout.seats[i.id]
      if (m && idsMesas.has(m)) {
        ocupacion[m] += i.n
        sentadas += i.n
      } else sinMesa.push(i)
    }
    return {
      lista,
      ocupacion,
      idsMesas,
      sinMesa,
      sentadas,
      totalPersonas: lista.reduce((s, i) => s + i.n, 0),
      capacidad: layout.tables.reduce((s, t) => s + t.cap, 0),
    }
  }, [invitaciones, layout])

  const mesaSel = layout.tables.find((t) => t.id === sel) || null
  const excedidas = layout.tables.filter((t) => ocupacion[t.id] > t.cap)

  // ---------------- edición ----------------
  function editar(fn) {
    setLayout((l) => fn(l))
    setSucio(true)
    setAviso(null)
  }
  const setVenue = (k, v) => editar((l) => reajustar({ ...l, venue: { ...l.venue, [k]: v } }))
  const setPista = (k, v) => editar((l) => reajustar({ ...l, dance: { ...l.dance, [k]: v } }))
  const editarMesa = (id, patch) => editar((l) => ({ ...l, tables: l.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))

  function agregarMesa() {
    if (layout.tables.length >= 80) return setAviso({ tipo: 'error', texto: 'El máximo es de 80 mesas.' })
    const id = nuevoId()
    editar((l) => {
      const p = puestoLibre(l)
      return { ...l, tables: [...l.tables, { id, name: nombreMesa(siguienteNumero(l)), label: '', x: p.x, y: p.y, cap: CAP }] }
    })
    setSel(id)
    setTab('mesas')
  }

  function eliminarMesa(id) {
    const t = layout.tables.find((x) => x.id === id)
    if (ocupacion[id] > 0 && !window.confirm(`${t.name} tiene ${ocupacion[id]} personas sentadas. Si la eliminan, esas invitaciones quedarán sin mesa. ¿Eliminar?`)) return
    editar((l) => ({
      ...l,
      tables: l.tables.filter((x) => x.id !== id),
      seats: Object.fromEntries(Object.entries(l.seats).filter(([, v]) => v !== id)),
    }))
    setSel(null)
  }

  function sentar(invId, mesaId) {
    editar((l) => {
      const seats = { ...l.seats }
      if (mesaId) seats[invId] = mesaId
      else delete seats[invId]
      return { ...l, seats }
    })
  }

  // Mejor ajuste: las invitaciones más grandes primero, en la mesa donde mejor caben.
  function sentarAutomatico() {
    const libres = {}
    layout.tables.forEach((t) => (libres[t.id] = t.cap - ocupacion[t.id]))
    const seats = { ...layout.seats }
    let sinLugar = 0
    for (const inv of [...sinMesa].sort((a, b) => b.n - a.n)) {
      let mejor = null
      for (const t of layout.tables) {
        if (libres[t.id] >= inv.n && (mejor === null || libres[t.id] < libres[mejor])) mejor = t.id
      }
      if (mejor) {
        seats[inv.id] = mejor
        libres[mejor] -= inv.n
      } else sinLugar++
    }
    editar((l) => ({ ...l, seats }))
    setAviso(
      sinLugar
        ? { tipo: 'error', texto: `${sinLugar} ${sinLugar === 1 ? 'invitación no cabe' : 'invitaciones no caben'} en las mesas libres. Agreguen una mesa o súbanle asientos a alguna.` }
        : { tipo: 'ok', texto: 'Listo: todas las invitaciones tienen mesa. Ajusten a mano lo que quieran.' }
    )
  }

  function restablecer() {
    if (!window.confirm('Se borrará la distribución actual y se armará una nueva desde cero (no se borran sus invitados). ¿Continuar?')) return
    setLayout(crearInicial(totalPersonas))
    setSel(null)
    setSucio(true)
  }

  // ---------------- arrastre (mouse y dedo) ----------------
  function iniciar(e, key) {
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = posDe(layout, key)
    drag.current = { key, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, movio: false }
    setSel(FIJOS.includes(key) ? null : key)
    if (!FIJOS.includes(key) && tab === 'salon') setTab('mesas')
  }
  function mover(e) {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.sx) / escala
    const dy = (e.clientY - d.sy) / escala
    if (!d.movio && Math.hypot(dx, dy) < 0.1) return
    d.movio = true
    setLayout((l) => {
      const p = limitar(l, d.key, d.ox + dx, d.oy + dy)
      return FIJOS.includes(d.key)
        ? { ...l, [d.key]: { ...l[d.key], ...p } }
        : { ...l, tables: l.tables.map((t) => (t.id === d.key ? { ...t, ...p } : t)) }
    })
    setSucio(true)
  }
  const soltar = () => (drag.current = null)

  // Flechas del teclado: 25 cm (1 m con Mayús).
  function teclas(e, key) {
    const paso = e.shiftKey ? 1 : 0.25
    const mv = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[e.key]
    if (!mv) return
    e.preventDefault()
    editar((l) => {
      const p = posDe(l, key)
      const n = limitar(l, key, p.x + mv[0], p.y + mv[1])
      return FIJOS.includes(key)
        ? { ...l, [key]: { ...l[key], ...n } }
        : { ...l, tables: l.tables.map((t) => (t.id === key ? { ...t, ...n } : t)) }
    })
  }

  function propsPieza(key) {
    const p = posDe(layout, key)
    const m = medidas(layout, key)
    return {
      tabIndex: 0,
      role: 'button',
      onPointerDown: (e) => iniciar(e, key),
      onPointerMove: mover,
      onPointerUp: soltar,
      onPointerCancel: soltar,
      onKeyDown: (e) => teclas(e, key),
      style: {
        left: (p.x - m.w / 2) * escala,
        top: (p.y - m.l / 2) * escala,
        width: m.w * escala,
        height: m.l * escala,
        touchAction: 'none',
      },
    }
  }

  // ---------------- guardar / exportar / importar ----------------
  async function guardar() {
    setGuardando(true)
    setAviso(null)
    const { error } = await supabase
      .from('seating_layouts')
      .upsert({ couple_id: couple.id, layout, updated_at: new Date().toISOString() }, { onConflict: 'couple_id' })
    setGuardando(false)
    if (error) {
      return setAviso({
        tipo: 'error',
        texto: /relation|does not exist|schema cache/i.test(error.message)
          ? 'Falta ejecutar la migración 16 en Supabase.'
          : `No se pudo guardar: ${error.message}`,
      })
    }
    setSucio(false)
    setAviso({ tipo: 'ok', texto: 'Croquis guardado.' })
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'croquis-cherry-bloom.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importar(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const raw = JSON.parse(await f.text())
      if (!raw?.venue || !Array.isArray(raw?.tables)) throw new Error('formato')
      setLayout(normalizar(raw, personasIniciales))
      setSel(null)
      setSucio(true)
      setAviso({ tipo: 'ok', texto: 'Croquis cargado. Revísenlo y pulsen Guardar.' })
    } catch {
      setAviso({ tipo: 'error', texto: 'Ese archivo no es un croquis válido de Cherry Bloom.' })
    }
  }

  const mesaDe = (invId) => layout.tables.find((t) => t.id === layout.seats[invId])
  const delante = (a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })

  // ---------------- interfaz ----------------
  return (
    <div className="space-y-6">
      <style>{`@media print { header, nav, aside { display: none !important; } }`}</style>

      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={guardar} disabled={guardando || !sucio} className="btn-primario btn-sm">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {sucio && <span className="rounded-full bg-oro-100 px-3 py-1 text-xs text-cacao-700">Cambios sin guardar</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={restablecer} className="btn-claro btn-sm">Restablecer</button>
          <button onClick={exportar} className="btn-claro btn-sm">Exportar</button>
          <button onClick={() => archivoRef.current?.click()} className="btn-claro btn-sm">Cargar archivo</button>
          <input ref={archivoRef} type="file" accept="application/json,.json" onChange={importar} className="hidden" />
          <button onClick={() => window.print()} className="btn-claro btn-sm">Imprimir / PDF</button>
        </div>
      </div>

      {aviso && (
        <p role="status" className={`rounded-2xl px-5 py-3 text-sm print:hidden ${aviso.tipo === 'ok' ? 'bg-salvia-100 text-cacao' : 'bg-rubor-100 text-terracota-800'}`}>
          {aviso.texto}
        </p>
      )}

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-4 print:hidden">
        {[
          ['Mesas', layout.tables.length],
          ['Asientos', capacidad],
          ['Personas', totalPersonas],
          ['Sin mesa', sinMesa.reduce((s, i) => s + i.n, 0)],
        ].map(([l, v]) => (
          <div key={l} className="tarjeta p-5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-rosa-600">{l}</span>
            <p className="mt-1 font-serif text-4xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {(totalPersonas > capacidad || excedidas.length > 0) && (
        <p className="rounded-2xl bg-rubor-100 px-5 py-3 text-sm text-terracota-800 print:hidden">
          {totalPersonas > capacidad && <>Hay {totalPersonas} personas y solo {capacidad} asientos: agreguen mesas o más asientos. </>}
          {excedidas.length > 0 && <>Pasadas de asientos: {excedidas.map((t) => `${t.name} (${ocupacion[t.id]}/${t.cap})`).join(', ')}.</>}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        {/* ============ Panel de control ============ */}
        <div className="tarjeta space-y-5 p-5 print:hidden">
          <div className="flex rounded-full border border-arena-300 p-0.5 text-xs font-medium">
            {[['salon', 'Salón'], ['mesas', `Mesas (${layout.tables.length})`], ['invitados', 'Invitados']].map(([v, t]) => (
              <button key={v} onClick={() => setTab(v)} className={`flex-1 rounded-full px-3 py-1.5 ${tab === v ? 'bg-terracota text-crema' : 'text-cacao-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'salon' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-xl font-semibold">Medidas del salón</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <NumCampo label="Ancho (m)" valor={layout.venue.w} min={6} max={60} onCommit={(v) => setVenue('w', v)} />
                  <NumCampo label="Largo (m)" valor={layout.venue.l} min={6} max={80} onCommit={(v) => setVenue('l', v)} />
                </div>
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold">Pista de baile</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <NumCampo label="Ancho (m)" valor={layout.dance.w} min={2} max={40} onCommit={(v) => setPista('w', v)} />
                  <NumCampo label="Largo (m)" valor={layout.dance.l} min={2} max={40} onCommit={(v) => setPista('l', v)} />
                </div>
              </div>
              <p className="text-xs text-cacao-500">
                Arrastren la pista, la mesa de novios y el buffet para moverlos. Con el teclado: flechas (Mayús para mover más).
              </p>
              <button onClick={agregarMesa} className="btn-primario w-full">Agregar mesa ({CAP} asientos)</button>
            </div>
          )}

          {tab === 'mesas' && (
            <div className="space-y-4">
              <button onClick={agregarMesa} className="btn-primario btn-sm w-full">Agregar mesa ({CAP} asientos)</button>

              {mesaSel && (
                <div className="space-y-3 rounded-2xl border border-terracota/40 bg-crema p-4">
                  <h2 className="font-serif text-xl font-semibold">Editar {mesaSel.name}</h2>
                  <div>
                    <label className="etiqueta">Nombre de la mesa</label>
                    <input className="campo" value={mesaSel.name} maxLength={30} onChange={(e) => editarMesa(mesaSel.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className="etiqueta">Grupo (ej. Padres y hermanos)</label>
                    <input className="campo" value={mesaSel.label} maxLength={40} onChange={(e) => editarMesa(mesaSel.id, { label: e.target.value })} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="etiqueta mb-0">Asientos</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => editarMesa(mesaSel.id, { cap: Math.max(1, mesaSel.cap - 1) })} className="btn-claro btn-sm h-9 w-9 px-0">−</button>
                      <span className="w-8 text-center font-serif text-2xl font-semibold">{mesaSel.cap}</span>
                      <button type="button" onClick={() => editarMesa(mesaSel.id, { cap: Math.min(20, mesaSel.cap + 1) })} className="btn-claro btn-sm h-9 w-9 px-0">+</button>
                    </div>
                  </div>

                  <div>
                    <p className="etiqueta">Sentados ({ocupacion[mesaSel.id]}/{mesaSel.cap})</p>
                    {lista.filter((i) => layout.seats[i.id] === mesaSel.id).length === 0 ? (
                      <p className="text-xs text-cacao-500">Nadie todavía. Asignen invitaciones en la pestaña Invitados.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {lista.filter((i) => layout.seats[i.id] === mesaSel.id).map((i) => (
                          <li key={i.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                            <span className="truncate">{i.name} <span className="text-cacao-500">· {i.n}</span></span>
                            <button onClick={() => sentar(i.id, '')} className="text-xs text-terracota hover:underline">Quitar</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button onClick={() => eliminarMesa(mesaSel.id)} className="btn-claro btn-sm w-full text-terracota-700">Eliminar mesa</button>
                </div>
              )}

              <ul className="space-y-1.5">
                {[...layout.tables].sort(delante).map((t) => {
                  const e = estadoMesa(ocupacion[t.id], t.cap)
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setSel(t.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm ${sel === t.id ? 'border-terracota bg-crema' : 'border-arena-200 bg-white'}`}
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{t.name}</span>
                          {t.label && <span className="block truncate text-xs text-cacao-500">{t.label}</span>}
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${e === 'exceso' ? 'bg-rubor-100 text-terracota-700' : e === 'llena' ? 'bg-salvia-100 text-salvia' : 'bg-arena text-cacao-700'}`}>
                          {ocupacion[t.id]}/{t.cap}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {layout.tables.length === 0 && <p className="text-sm text-cacao-500">Aún no hay mesas. Agreguen la primera.</p>}
            </div>
          )}

          {tab === 'invitados' && (
            <div className="space-y-4">
              <div>
                <label className="etiqueta">¿Cuántas sillas reservar?</label>
                <select
                  className="campo"
                  value={layout.modo}
                  onChange={(e) => editar((l) => ({ ...l, modo: e.target.value }))}
                >
                  <option value="esperados">Confirmados + pases de quienes no han respondido</option>
                  <option value="confirmados">Solo quienes ya confirmaron</option>
                </select>
              </div>

              {lista.length === 0 ? (
                <p className="text-sm text-cacao-500">
                  Todavía no hay invitaciones para sentar. Regístrenlas en la sección de invitados.
                </p>
              ) : (
                <>
                  <button onClick={sentarAutomatico} disabled={sinMesa.length === 0 || layout.tables.length === 0} className="btn-primario btn-sm w-full">
                    Sentar automáticamente a los que faltan
                  </button>
                  <p className="text-xs text-cacao-500">{sentadas} de {totalPersonas} personas ya tienen mesa.</p>

                  <ul className="space-y-2">
                    {[...lista]
                      .sort((a, b) => Number(!!idsMesas.has(layout.seats[a.id])) - Number(!!idsMesas.has(layout.seats[b.id])) || a.name.localeCompare(b.name, 'es'))
                      .map((i) => {
                        const m = mesaDe(i.id)
                        return (
                          <li key={i.id} className="rounded-xl border border-arena-200 bg-white p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium">{i.name}</span>
                              <span className="shrink-0 text-xs text-cacao-500">
                                {i.n} {i.n === 1 ? 'silla' : 'sillas'}
                                {i.status === 'pendiente' && ' · sin responder'}
                              </span>
                            </div>
                            <select
                              className="campo mt-2 !py-1.5 text-sm"
                              value={m ? m.id : ''}
                              onChange={(e) => sentar(i.id, e.target.value)}
                              aria-label={`Mesa de ${i.name}`}
                            >
                              <option value="">Sin mesa</option>
                              {[...layout.tables].sort(delante).map((t) => {
                                const actual = m?.id === t.id
                                const libres = t.cap - ocupacion[t.id]
                                return (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ·{' '}
                                    {actual
                                      ? `su mesa (${ocupacion[t.id]}/${t.cap})`
                                      : libres >= i.n
                                        ? `${libres} libres`
                                        : libres > 0
                                          ? `${libres} libres, no cabe`
                                          : 'llena'}
                                  </option>
                                )
                              })}
                            </select>
                          </li>
                        )
                      })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* ============ Plano ============ */}
        <div>
          <div ref={wrapRef} className="overflow-x-auto rounded-2xl bg-arena/60 p-4 print:bg-white print:p-0">
            <div
              className="relative mx-auto border-4 border-cacao bg-white shadow-suave"
              style={{
                width: layout.venue.w * escala,
                height: layout.venue.l * escala,
                backgroundImage: 'radial-gradient(#DCC7AE 1px, transparent 1px)',
                backgroundSize: `${escala}px ${escala}px`,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
              onPointerDown={(e) => e.target === e.currentTarget && setSel(null)}
            >
              <div
                {...propsPieza('dance')}
                className="absolute flex cursor-move select-none items-center justify-center border-2 border-dashed border-oro bg-oro-100 text-center font-serif text-sm font-semibold text-cacao-700"
              >
                Pista de baile
                <span className="sr-only">
                  {layout.dance.w} por {layout.dance.l} metros
                </span>
              </div>

              <div
                {...propsPieza('head')}
                className="absolute flex cursor-move select-none items-center justify-center rounded-xl border-2 border-rubor-300 bg-rubor text-center font-serif text-sm font-semibold text-terracota-800"
              >
                Mesa de novios
              </div>

              <div
                {...propsPieza('buffet')}
                className="absolute flex cursor-move select-none items-center justify-center rounded-lg border-2 border-oro bg-oro-100 text-center font-serif text-sm font-semibold text-cacao-700"
              >
                Torta y buffet
              </div>

              {layout.tables.map((t) => {
                const ocup = ocupacion[t.id]
                const est = estadoMesa(ocup, t.cap)
                const ext = R_EXT * 2 * escala
                const silla = Math.max(6, 0.36 * escala)
                return (
                  <div
                    key={t.id}
                    {...propsPieza(t.id)}
                    aria-label={`${t.name}, ${ocup} de ${t.cap} asientos`}
                    className={`absolute cursor-grab select-none rounded-full outline-none active:cursor-grabbing ${sel === t.id ? 'ring-4 ring-terracota/30' : 'focus-visible:ring-4 focus-visible:ring-oro/40'}`}
                  >
                    {Array.from({ length: t.cap }).map((_, i) => {
                      const ang = (i / t.cap) * Math.PI * 2 - Math.PI / 2
                      const rad = (MESA_D / 2 + SILLA / 2) * escala
                      return (
                        <span
                          key={i}
                          className={`absolute rounded-full border ${i < ocup ? (est === 'exceso' ? 'border-terracota bg-terracota' : 'border-salvia bg-salvia') : 'border-cacao-300 bg-arena'}`}
                          style={{
                            width: silla,
                            height: silla,
                            left: ext / 2 + Math.cos(ang) * rad - silla / 2,
                            top: ext / 2 + Math.sin(ang) * rad - silla / 2,
                          }}
                        />
                      )
                    })}
                    <div
                      className={`absolute flex flex-col items-center justify-center rounded-full border-2 text-center leading-tight ${ESTADO_MESA[est]}`}
                      style={{ width: MESA_D * escala, height: MESA_D * escala, left: (ext - MESA_D * escala) / 2, top: (ext - MESA_D * escala) / 2 }}
                    >
                      <span className="font-serif font-semibold text-cacao" style={{ fontSize: Math.max(9, escala * 0.4) }}>
                        {t.name.replace(/^Mesa\s*/i, '') || t.name}
                      </span>
                      <span className="text-cacao-500" style={{ fontSize: Math.max(8, escala * 0.3) }}>
                        {ocup}/{t.cap}
                      </span>
                      {t.label && escala >= 18 && (
                        <span className="max-w-[90%] truncate text-cacao-700" style={{ fontSize: Math.max(8, escala * 0.28) }}>
                          {t.label}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mx-auto mt-3 w-fit rounded-full bg-cacao px-4 py-1 text-xs text-crema">Entrada principal</p>
          </div>
          <p className="mt-2 text-xs text-cacao-500 print:hidden">
            Escala: 1 metro = {Math.round(escala)} píxeles · Sillas verdes: ocupadas · Mesa roja: se pasó de asientos.
          </p>
        </div>
      </div>

      {/* Solo al imprimir: listado por mesa */}
      <div className="hidden print:block">
        <h2 className="font-serif text-2xl font-semibold">
          {couple.bride_name} & {couple.groom_name} · Distribución de mesas
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {[...layout.tables].sort(delante).map((t) => (
            <div key={t.id} className="break-inside-avoid rounded-xl border border-arena-300 p-3 text-sm">
              <p className="font-serif text-lg font-semibold">
                {t.name} <span className="text-xs font-normal text-cacao-500">({ocupacion[t.id]}/{t.cap})</span>
              </p>
              {t.label && <p className="text-xs text-cacao-500">{t.label}</p>}
              <ul className="mt-1">
                {lista.filter((i) => layout.seats[i.id] === t.id).map((i) => (
                  <li key={i.id}>{i.name} · {i.n}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {sinMesa.length > 0 && (
          <p className="mt-4 text-sm">Sin mesa: {sinMesa.map((i) => `${i.name} (${i.n})`).join(', ')}</p>
        )}
      </div>
    </div>
  )
}