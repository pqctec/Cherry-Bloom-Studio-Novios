'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import { createClient } from '@/lib/supabase/client'
import { soles } from '@/lib/escenarios'
import {
  Badge,
  Confirm,
  Drawer,
  Field,
  ImageUpload,
  PageHeader,
  SearchInput,
  Toggle,
  descargarCsv,
  dinero,
  fechaCorta,
  parseCsv,
  precioVenta,
  useToast,
} from '@/components/admin/ui'

const VACIO = {
  id: null,
  sku: '',
  category: '',
  title: '',
  description: '',
  image_url: '',
  reference_price: '',
  reference_store: '',
  reference_url: '',
  sort_order: '',
  active: true,
  notes: '',
}

const COLUMNAS_CSV = ['sku', 'category', 'title', 'description', 'reference_price', 'reference_store', 'reference_url', 'image_url', 'sort_order', 'active', 'notes']

export default function CatalogoAdmin({ productos, error }) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [estado, setEstado] = useState('todos')
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [borrar, setBorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)
  const [importar, setImportar] = useState(null)
  const archivo = useRef(null)

  const categorias = useMemo(() => [...new Set(productos.map((p) => p.category))].sort(), [productos])

  const visibles = productos.filter((p) => {
    if (categoria && p.category !== categoria) return false
    if (estado === 'activos' && !p.active) return false
    if (estado === 'ocultos' && p.active) return false
    if (busqueda) {
      const t = `${p.title} ${p.sku} ${p.category} ${p.reference_store || ''}`.toLowerCase()
      if (!t.includes(busqueda.toLowerCase())) return false
    }
    return true
  })

  function nuevo() {
    const max = productos.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
    setEditando({ ...VACIO, sku: `CB-${String(productos.length + 1).padStart(3, '0')}`, sort_order: max + 10 })
  }

  const set = (campo) => (e) => setEditando((f) => ({ ...f, [campo]: e?.target ? e.target.value : e }))

  async function guardar(e) {
    e.preventDefault()
    const f = editando
    if (!f.title.trim() || !f.category.trim() || !f.sku.trim() || !(Number(f.reference_price) > 0)) {
      toast('Completa nombre, categoría, código y precio de referencia', 'error')
      return
    }
    setGuardando(true)
    const datos = {
      sku: f.sku.trim(),
      category: f.category.trim(),
      title: f.title.trim(),
      description: f.description?.trim() || null,
      image_url: f.image_url?.trim() || null,
      reference_price: Number(f.reference_price),
      reference_store: f.reference_store?.trim() || null,
      reference_url: f.reference_url?.trim() || null,
      sort_order: Number(f.sort_order) || 0,
      active: !!f.active,
      notes: f.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: err } = f.id
      ? await supabase.from('gift_catalog').update(datos).eq('id', f.id)
      : await supabase.from('gift_catalog').insert(datos)
    setGuardando(false)
    if (err) {
      toast(/duplicate|unique/i.test(err.message) ? 'Ya existe un producto con ese código (sku)' : err.message, 'error')
      return
    }
    toast(f.id ? 'Producto actualizado' : 'Producto creado')
    setEditando(null)
    router.refresh()
  }

  async function alternarActivo(p) {
    const { error: err } = await supabase.from('gift_catalog').update({ active: !p.active, updated_at: new Date().toISOString() }).eq('id', p.id)
    if (err) return toast(err.message, 'error')
    toast(p.active ? 'Producto oculto para los novios' : 'Producto visible')
    router.refresh()
  }

  async function confirmarBorrado() {
    setBorrando(true)
    const { error: err } = await supabase.from('gift_catalog').delete().eq('id', borrar.id)
    setBorrando(false)
    if (err) return toast(err.message, 'error')
    toast('Producto eliminado')
    setBorrar(null)
    router.refresh()
  }

  async function leerCsv(file) {
    if (!file) return
    const texto = await file.text()
    const [cab, ...filas] = parseCsv(texto)
    const idx = Object.fromEntries((cab || []).map((h, i) => [h.trim(), i]))
    const errores = []
    for (const c of ['sku', 'category', 'title', 'reference_price']) if (!(c in idx)) errores.push(`Falta la columna "${c}"`)
    const registros = errores.length
      ? []
      : filas.map((f, n) => {
          const o = Object.fromEntries(COLUMNAS_CSV.filter((c) => c in idx).map((c) => [c, (f[idx[c]] || '').trim()]))
          o.reference_price = String(o.reference_price || '').replace(/^S\/\s*/i, '').replace(/,/g, '')
          if (o.active) o.active = /^(true|si|sí|1|x|verdadero)$/i.test(o.active) ? 'true' : 'false'
          if (!o.sku || !o.title || !o.category || !(Number(o.reference_price) > 0)) errores.push(`Fila ${n + 2}: faltan datos o el precio no es válido`)
          return o
        })
    const existentes = new Set(productos.map((p) => p.sku))
    setImportar({
      nombre: file.name,
      registros,
      errores,
      nuevos: registros.filter((r) => !existentes.has(r.sku)).length,
      actualizados: registros.filter((r) => existentes.has(r.sku)).length,
    })
    if (archivo.current) archivo.current.value = ''
  }

  async function confirmarImportacion() {
    setGuardando(true)
    const { data, error: err } = await supabase.rpc('admin_importar_catalogo', { p_filas: importar.registros })
    setGuardando(false)
    if (err) return toast(err.message, 'error')
    toast(`${data} productos importados`)
    setImportar(null)
    router.refresh()
  }

  function exportar() {
    descargarCsv(`catalogo-regalos-${new Date().toISOString().slice(0, 10)}.csv`, COLUMNAS_CSV, productos)
  }

  const ref = Number(editando?.reference_price) || 0
  const venta = precioVenta(ref)

  return (
    <div>
      <PageHeader
        title="Catálogo de regalos"
        description="Lo que los novios pueden elegir para su lista. El precio de venta se calcula solo: referencia + 10 %, redondeado al sol."
        actions={
          <>
            <button onClick={() => archivo.current?.click()} className="btn-claro btn-sm bg-white">
              <Icon name="upload" className="h-4 w-4" /> Importar CSV
            </button>
            <button onClick={exportar} className="btn-claro btn-sm bg-white">
              <Icon name="download" className="h-4 w-4" /> Exportar
            </button>
            <button onClick={nuevo} className="btn-primario btn-sm">
              <Icon name="plus" className="h-4 w-4" /> Nuevo producto
            </button>
          </>
        }
      />
      <input ref={archivo} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => leerCsv(e.target.files?.[0])} />

      {error && <p className="mb-4 rounded-xl bg-rubor-100 px-4 py-3 text-sm text-terracota-800">{error}</p>}

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-arena-200 bg-white p-3 sm:flex-row sm:items-center">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, código o tienda" />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo bg-white sm:w-52">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="flex rounded-xl border border-arena-300 p-0.5 text-xs font-medium">
          {[
            ['todos', 'Todos'],
            ['activos', 'Visibles'],
            ['ocultos', 'Ocultos'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setEstado(v)}
              className={`rounded-lg px-3 py-1.5 ${estado === v ? 'bg-cacao text-crema' : 'text-cacao-700 hover:bg-arena'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-cacao-500 sm:ml-auto">
          {visibles.length} de {productos.length}
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-arena-200 bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-arena-200 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-cacao-500">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Referencia</th>
              <th className="px-4 py-3 text-right">Venta</th>
              <th className="px-4 py-3 text-right">Margen</th>
              <th className="px-4 py-3 text-center">En listas</th>
              <th className="px-4 py-3 text-center">Visible</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-arena-200/70">
            {visibles.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-sm text-cacao-500">
                  No hay productos con esos filtros.
                </td>
              </tr>
            )}
            {visibles.map((p) => (
              <tr key={p.id} className={`group hover:bg-crema/60 ${p.active ? '' : 'opacity-60'}`}>
                <td className="px-4 py-3">
                  <button onClick={() => setEditando({ ...VACIO, ...p })} className="flex items-center gap-3 text-left">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-arena-200 bg-white">
                      {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-contain p-1" /> : <Icon name="gift" className="h-5 w-5 text-cacao-300" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[280px] truncate font-medium text-cacao group-hover:text-terracota">{p.title}</span>
                      <span className="block text-[11px] text-cacao-500">
                        {p.sku}
                        {p.reference_store ? ` · ${p.reference_store}` : ''}
                        {p.notes ? ' · 📝' : ''}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Badge>{p.category}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-cacao-700">{dinero(p.reference_price)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-cacao">{soles(p.price)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-salvia">{dinero(Number(p.price) - Number(p.reference_price))}</td>
                <td className="px-4 py-3 text-center text-cacao-700">{p.en_listas}</td>
                <td className="px-4 py-3 text-center">
                  <Toggle checked={p.active} onChange={() => alternarActivo(p)} label="Visible para los novios" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditando({ ...VACIO, ...p })} className="rounded-lg p-2 text-cacao-500 hover:bg-arena hover:text-cacao" title="Editar">
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                    <button onClick={() => setBorrar(p)} className="rounded-lg p-2 text-cacao-500 hover:bg-rubor-100 hover:text-terracota-800" title="Eliminar">
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor */}
      <Drawer
        open={!!editando}
        onClose={() => setEditando(null)}
        title={editando?.id ? 'Editar producto' : 'Nuevo producto'}
        subtitle={editando?.id ? `Actualizado ${fechaCorta(editando.updated_at)} · en ${editando.en_listas || 0} listas` : 'Aparecerá en el catálogo de los novios'}
        footer={
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-cacao-700">
              <Toggle checked={!!editando?.active} onChange={(v) => setEditando((f) => ({ ...f, active: v }))} label="Visible" />
              {editando?.active ? 'Visible para los novios' : 'Oculto'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditando(null)} className="btn-claro btn-sm">
                Cancelar
              </button>
              <button type="submit" form="form-producto" disabled={guardando} className="btn-primario btn-sm">
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        }
      >
        {editando && (
          <form id="form-producto" onSubmit={guardar} className="space-y-5">
            <ImageUpload value={editando.image_url} onChange={set('image_url')} carpeta="regalos" />

            <Field label="Nombre del producto">
              <input value={editando.title} onChange={set('title')} className="campo bg-white" placeholder="Licuadora Oster 2 L" autoFocus />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría" hint="Elige una existente o escribe una nueva">
                <input value={editando.category} onChange={set('category')} list="categorias-regalos" className="campo bg-white" placeholder="Cocina" />
                <datalist id="categorias-regalos">
                  {categorias.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Código (sku)" hint="Único, lo usa la importación CSV">
                <input value={editando.sku} onChange={set('sku')} className="campo bg-white" />
              </Field>
            </div>

            <Field label="Descripción" hint="La ven los novios y los invitados">
              <textarea value={editando.description || ''} onChange={set('description')} rows={3} className="campo bg-white" />
            </Field>

            <div className="rounded-2xl border border-arena-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-cacao-500">Precio</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Referencia (S/)" className="sm:col-span-1">
                  <input type="number" min="0" step="0.01" value={editando.reference_price} onChange={set('reference_price')} className="campo" placeholder="0.00" />
                </Field>
                <div>
                  <span className="etiqueta">Venta (auto)</span>
                  <p className="rounded-xl bg-crema px-3.5 py-2.5 font-serif text-xl font-semibold text-terracota">{soles(venta)}</p>
                </div>
                <div>
                  <span className="etiqueta">Tu margen</span>
                  <p className="rounded-xl bg-salvia-100 px-3.5 py-2.5 font-serif text-xl font-semibold text-salvia">{dinero(venta ? venta - ref : 0)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-arena-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-cacao-500">Datos internos · solo los ves tú</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tienda de referencia">
                  <input value={editando.reference_store || ''} onChange={set('reference_store')} className="campo" placeholder="Ripley, Falabella…" />
                </Field>
                <Field label="Orden en el catálogo" hint="Menor número = aparece primero">
                  <input type="number" value={editando.sort_order} onChange={set('sort_order')} className="campo" />
                </Field>
              </div>
              <Field label="Link del producto en la tienda" className="mt-4">
                <div className="flex gap-2">
                  <input value={editando.reference_url || ''} onChange={set('reference_url')} className="campo" placeholder="https://…" />
                  {editando.reference_url && (
                    <a href={editando.reference_url} target="_blank" rel="noreferrer" className="btn-claro btn-sm shrink-0 px-3" title="Abrir">
                      <Icon name="external" className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </Field>
              <Field label="Notas" className="mt-4">
                <textarea value={editando.notes || ''} onChange={set('notes')} rows={2} className="campo" placeholder="Stock, fecha del precio, proveedor…" />
              </Field>
            </div>

            {editando.id && Number(editando.en_listas) > 0 && (
              <p className="rounded-xl bg-oro-100 px-4 py-3 text-xs text-cacao-700">
                Este producto ya está en {editando.en_listas} {editando.en_listas === 1 ? 'lista' : 'listas'}. Si cambias el precio, esas
                parejas mantienen el precio con el que lo agregaron; el nuevo aplica a quienes lo agreguen desde ahora.
              </p>
            )}
          </form>
        )}
      </Drawer>

      {/* Borrar */}
      <Confirm
        open={!!borrar}
        title="¿Eliminar este producto?"
        message={
          borrar && Number(borrar.en_listas) > 0
            ? `“${borrar.title}” está en ${borrar.en_listas} listas de novios. Te recomendamos ocultarlo en lugar de eliminarlo; si lo eliminas, seguirá en esas listas pero ya no estará en el catálogo.`
            : `“${borrar?.title}” se eliminará del catálogo. Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        danger
        loading={borrando}
        onConfirm={confirmarBorrado}
        onCancel={() => setBorrar(null)}
      />

      {/* Importación */}
      <Drawer
        open={!!importar}
        onClose={() => setImportar(null)}
        title="Importar catálogo desde CSV"
        subtitle={importar?.nombre}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setImportar(null)} className="btn-claro btn-sm">
              Cancelar
            </button>
            <button
              onClick={confirmarImportacion}
              disabled={guardando || !importar || importar.errores.length > 0 || importar.registros.length === 0}
              className="btn-primario btn-sm"
            >
              {guardando ? 'Importando…' : `Importar ${importar?.registros.length || 0} productos`}
            </button>
          </div>
        }
      >
        {importar && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-arena-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-cacao-500">Nuevos</p>
                <p className="mt-1 font-serif text-3xl font-semibold text-cacao">{importar.nuevos}</p>
              </div>
              <div className="rounded-2xl border border-arena-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-cacao-500">Se actualizan</p>
                <p className="mt-1 font-serif text-3xl font-semibold text-cacao">{importar.actualizados}</p>
              </div>
            </div>
            {importar.errores.length > 0 && (
              <div className="rounded-2xl bg-rubor-100 p-4 text-sm text-terracota-800">
                <p className="font-medium">Corrige esto en el archivo y vuelve a importarlo:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {importar.errores.slice(0, 12).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-2xl border border-arena-200 bg-white">
              <p className="border-b border-arena-200 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-cacao-500">Vista previa</p>
              <ul className="max-h-80 divide-y divide-arena-200 overflow-y-auto text-sm">
                {importar.registros.slice(0, 50).map((r) => (
                  <li key={r.sku} className="flex items-center justify-between gap-3 px-4 py-2">
                    <span className="min-w-0 truncate">
                      <span className="text-xs text-cacao-500">{r.sku}</span> · {r.title}
                    </span>
                    <span className="shrink-0 text-xs text-cacao-700">
                      {soles(r.reference_price)} → <b>{soles(precioVenta(r.reference_price))}</b>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-cacao-500">
              Columnas: <code>{COLUMNAS_CSV.join(', ')}</code>. Obligatorias: sku, category, title y reference_price. Si un sku ya
              existe, se actualiza. Consejo: usa “Exportar” para bajar el catálogo actual, edítalo en Excel y vuelve a importarlo.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
