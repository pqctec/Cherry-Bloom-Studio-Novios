// Convierte supabase/catalogo_regalos.csv en un SQL listo para pegar en el
// SQL Editor de Supabase. Inserta los productos nuevos y ACTUALIZA los que
// ya existen (por su sku), así que sirve tanto para cargar productos nuevos
// como para cambiar precios o fotos de forma masiva.
//
// Uso (terminal de VS Code):  npm run catalogo
// Resultado:                   supabase/catalogo_carga.sql
//
// El precio de venta NO va en el CSV: la base de datos lo calcula sola
// (precio de referencia + 10 %, redondeado hacia arriba al sol entero).

import { readFileSync, writeFileSync } from 'node:fs'

const ENTRADA = 'supabase/catalogo_regalos.csv'
const SALIDA = 'supabase/catalogo_carga.sql'
const COLUMNAS = ['sku', 'category', 'title', 'description', 'reference_price', 'reference_store', 'reference_url', 'image_url', 'sort_order', 'active', 'notes']
const OBLIGATORIAS = ['sku', 'category', 'title', 'reference_price']

// Lector de CSV simple que respeta comillas y comas dentro de los textos
// (el formato que exportan Excel y Google Sheets).
function parseCsv(texto) {
  const filas = []
  let fila = []
  let campo = ''
  let enComillas = false
  texto = texto.replace(/^﻿/, '')
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') enComillas = false
      else campo += c
    } else if (c === '"') enComillas = true
    else if (c === ',' || c === ';') { fila.push(campo); campo = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo); campo = ''
      if (fila.some((v) => v.trim() !== '')) filas.push(fila)
      fila = []
    } else campo += c
  }
  fila.push(campo)
  if (fila.some((v) => v.trim() !== '')) filas.push(fila)
  return filas
}

const texto = (v) => (v === undefined || v.trim() === '' ? 'null' : `'${v.trim().replace(/'/g, "''")}'`)
const numero = (v, porDefecto = 'null') => {
  if (v === undefined || v.trim() === '') return porDefecto
  const n = Number(v.trim().replace(/^S\/\s*/i, '').replace(/,/g, ''))
  if (Number.isNaN(n)) throw new Error(`"${v}" no es un número`)
  return String(n)
}
const booleano = (v) => (v === undefined || v.trim() === '' ? 'true' : /^(true|si|sí|1|x)$/i.test(v.trim()) ? 'true' : 'false')

const [encabezado, ...filas] = parseCsv(readFileSync(ENTRADA, 'utf8'))
const indice = Object.fromEntries(encabezado.map((h, i) => [h.trim(), i]))
for (const col of OBLIGATORIAS) {
  if (!(col in indice)) throw new Error(`Falta la columna "${col}" en ${ENTRADA}`)
}

const valores = filas.map((f, n) => {
  const get = (col) => (col in indice ? f[indice[col]] : undefined)
  for (const col of OBLIGATORIAS) {
    if (!get(col) || !get(col).trim()) throw new Error(`Fila ${n + 2}: falta "${col}"`)
  }
  try {
    return `  (${[
      texto(get('sku')), texto(get('category')), texto(get('title')), texto(get('description')),
      numero(get('reference_price')), texto(get('reference_store')), texto(get('reference_url')),
      texto(get('image_url')), numero(get('sort_order'), '0'), booleano(get('active')), texto(get('notes')),
    ].join(', ')})`
  } catch (e) {
    throw new Error(`Fila ${n + 2}: ${e.message}`)
  }
})

const sql = `-- Generado por "npm run catalogo" el ${new Date().toLocaleString('es-PE')}
-- ${valores.length} productos desde ${ENTRADA}. Pégalo en el SQL Editor de Supabase.
insert into public.gift_catalog
  (${COLUMNAS.join(', ')})
values
${valores.join(',\n')}
on conflict (sku) do update set
${COLUMNAS.filter((c) => c !== 'sku').map((c) => `  ${c} = excluded.${c},`).join('\n')}
  updated_at = now();
`

writeFileSync(SALIDA, sql)
console.log(`Listo: ${valores.length} productos -> ${SALIDA}`)
console.log('Ábrelo, copia todo y ejecútalo en Supabase -> SQL Editor.')
