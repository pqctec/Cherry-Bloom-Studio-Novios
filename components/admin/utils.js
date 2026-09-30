// Funciones puras del panel (sin 'use client'): se pueden usar tanto en
// componentes de servidor como de cliente.

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

// Mismo cálculo que la base de datos: referencia + 10 %, redondeado hacia
// arriba al sol entero (en enteros para evitar errores de decimales).
export function precioVenta(referencia) {
  const centimos = Math.round(Number(referencia || 0) * 100)
  if (!centimos) return 0
  return Math.ceil((centimos * 110) / 10000)
}

export function slugify(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function parseCsv(texto) {
  const filas = []
  let fila = []
  let campo = ''
  let comillas = false
  texto = texto.replace(/^﻿/, '')
  const sep = (texto.split('\n')[0].match(/;/g) || []).length > (texto.split('\n')[0].match(/,/g) || []).length ? ';' : ','
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') comillas = false
      else campo += c
    } else if (c === '"') comillas = true
    else if (c === sep) {
      fila.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo)
      campo = ''
      if (fila.some((v) => v.trim() !== '')) filas.push(fila)
      fila = []
    } else campo += c
  }
  fila.push(campo)
  if (fila.some((v) => v.trim() !== '')) filas.push(fila)
  return filas
}

export function descargarCsv(nombre, columnas, filas) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const contenido = '﻿' + [columnas.join(','), ...filas.map((f) => columnas.map((c) => esc(f[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export const fechaCorta = (f) =>
  f ? new Date(f.length === 10 ? f + 'T00:00:00' : f).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const dinero = (n) => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
