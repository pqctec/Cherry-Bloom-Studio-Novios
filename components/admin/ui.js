'use client'

// Piezas de interfaz del panel de administración: panel lateral de edición,
// avisos, diálogo de confirmación, interruptor, subida de fotos, etc.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Icon from '@/components/Icon'
import { createClient } from '@/lib/supabase/client'

/* ------------------------------------------------------------------ */
/* Avisos (toasts)                                                     */
/* ------------------------------------------------------------------ */
const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((mensaje, tipo = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, mensaje, tipo }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-suave ${
              t.tipo === 'error' ? 'bg-terracota-800 text-white' : 'bg-cacao text-crema'
            }`}
          >
            <Icon name={t.tipo === 'error' ? 'x' : 'check'} className="h-4 w-4" />
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

/* ------------------------------------------------------------------ */
/* Panel lateral (drawer)                                              */
/* ------------------------------------------------------------------ */
export function Drawer({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-cacao/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-crema shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-arena-200 px-6 py-5">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-cacao">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-cacao-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-cacao-500 hover:bg-arena hover:text-cacao" aria-label="Cerrar">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="border-t border-arena-200 bg-white/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Diálogo de confirmación                                             */
/* ------------------------------------------------------------------ */
export function Confirm({ open, title, message, confirmLabel = 'Confirmar', danger, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-cacao/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-crema p-6 shadow-2xl">
        <h3 className="font-serif text-xl font-semibold text-cacao">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-cacao-700">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-claro btn-sm">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn btn-sm ${danger ? 'bg-terracota-800 text-white hover:bg-terracota-700' : 'bg-terracota text-crema hover:bg-terracota-700'}`}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Controles                                                           */
/* ------------------------------------------------------------------ */
export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-salvia' : 'bg-arena-300'
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="etiqueta">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-cacao-500">{hint}</span>}
    </label>
  )
}

export function Badge({ children, tono = 'neutro' }) {
  const tonos = {
    neutro: 'bg-arena text-cacao-700',
    ok: 'bg-salvia-100 text-salvia',
    alerta: 'bg-oro-100 text-oro',
    rojo: 'bg-rubor-100 text-terracota-800',
    oscuro: 'bg-cacao text-crema',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tonos[tono]}`}>{children}</span>
}

export function StatCard({ label, value, sub, icon }) {
  return (
    <div className="rounded-2xl border border-arena-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-cacao-500">{label}</span>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rubor-100 text-terracota">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-serif text-3xl font-semibold text-cacao">{value}</p>
      {sub && <p className="mt-1 text-xs text-cacao-500">{sub}</p>}
    </div>
  )
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-cacao">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-cacao-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Buscar…' }) {
  return (
    <label className="relative block w-full sm:w-72">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cacao-300" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="campo bg-white pl-9" />
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Subida de fotos a Supabase Storage (espacio "catalogo")             */
/* ------------------------------------------------------------------ */

// Reduce la foto a máx. 1400 px y la guarda como JPG de buena calidad, para
// que la página cargue rápido aunque subas fotos pesadas del celular.
async function comprimir(file, max = 1400) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  const bitmap = await createImageBitmap(file)
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
  return blob || file
}

export function ImageUpload({ value, onChange, carpeta = 'regalos', contain = true }) {
  const supabase = createClient()
  const toast = useToast()
  const input = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [modoLink, setModoLink] = useState(false)

  async function subir(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('El archivo debe ser una imagen', 'error')
      return
    }
    setSubiendo(true)
    try {
      const datos = await comprimir(file)
      const nombre = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
      const { error } = await supabase.storage.from('catalogo').upload(nombre, datos, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      })
      if (error) throw error
      const { data } = supabase.storage.from('catalogo').getPublicUrl(nombre)
      onChange(data.publicUrl)
      toast('Foto subida')
    } catch (e) {
      toast(e.message || 'No se pudo subir la foto', 'error')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          subir(e.dataTransfer.files?.[0])
        }}
        className={`relative flex h-52 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white transition-colors ${
          arrastrando ? 'border-terracota bg-rubor-100/50' : 'border-arena-300'
        }`}
      >
        {value ? (
          <>
            <img src={value} alt="" className={`h-full w-full ${contain ? 'object-contain p-3' : 'object-cover'}`} />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-cacao/60 to-transparent p-3">
              <button type="button" onClick={() => input.current?.click()} className="btn btn-sm bg-white/95 text-cacao hover:bg-white">
                <Icon name="upload" className="h-4 w-4" /> Cambiar
              </button>
              <button type="button" onClick={() => onChange('')} className="btn btn-sm bg-white/95 text-terracota-800 hover:bg-white">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex flex-col items-center gap-2 p-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rubor-100 text-terracota">
              <Icon name="upload" className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-cacao">Arrastra una foto o haz clic para subir</span>
            <span className="text-xs text-cacao-500">JPG, PNG o WEBP · se optimiza automáticamente</span>
          </button>
        )}
        {subiendo && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-cacao">Subiendo foto…</div>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
      <button type="button" onClick={() => setModoLink((v) => !v)} className="mt-2 text-xs font-medium text-rosa-600 hover:text-terracota">
        {modoLink ? 'Ocultar link' : 'O pegar el link de una imagen'}
      </button>
      {modoLink && <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="campo mt-2 bg-white" placeholder="https://…" />}
    </div>
  )
}

export { precioVenta, slugify, parseCsv, descargarCsv, fechaCorta, dinero } from './utils'
