'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import { createClient } from '@/lib/supabase/client'
import { Badge, Confirm, Drawer, Field, ImageUpload, PageHeader, SearchInput, Toggle, slugify, useToast } from '@/components/admin/ui'

const VACIO = { id: null, slug: '', category: '', title: '', description: '', image_url: '', price_label: 'A cotizar', sort_order: '', active: true }

export default function DecoracionAdmin({ servicios }) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [editando, setEditando] = useState(null)
  const [aCotizar, setACotizar] = useState(true)
  const [desde, setDesde] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [borrar, setBorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)

  const categorias = useMemo(() => [...new Set(servicios.map((s) => s.category))], [servicios])
  const visibles = servicios.filter(
    (s) => (!categoria || s.category === categoria) && (!busqueda || `${s.title} ${s.description || ''}`.toLowerCase().includes(busqueda.toLowerCase()))
  )

  function abrir(s) {
    const item = { ...VACIO, ...s }
    const m = /S\/\s*([\d.,]+)/.exec(item.price_label || '')
    setACotizar(!m)
    setDesde(m ? m[1] : '')
    setEditando(item)
  }

  function nuevo() {
    const max = servicios.reduce((m, s) => Math.max(m, s.sort_order || 0), 0)
    abrir({ ...VACIO, category: categoria || '', sort_order: max + 10 })
  }

  const set = (campo) => (e) => setEditando((f) => ({ ...f, [campo]: e?.target ? e.target.value : e }))

  async function guardar(e) {
    e.preventDefault()
    const f = editando
    if (!f.title.trim() || !f.category.trim()) return toast('Completa el nombre y la categoría', 'error')
    if (!aCotizar && !(Number(String(desde).replace(/,/g, '')) > 0)) return toast('Escribe el precio “desde”', 'error')
    setGuardando(true)
    const datos = {
      slug: f.slug?.trim() || slugify(f.title),
      category: f.category.trim(),
      title: f.title.trim(),
      description: f.description?.trim() || null,
      image_url: f.image_url?.trim() || null,
      price_label: aCotizar ? 'A cotizar' : `Desde S/ ${Number(String(desde).replace(/,/g, '')).toLocaleString('es-PE')}`,
      sort_order: Number(f.sort_order) || 0,
      active: !!f.active,
    }
    const { error } = f.id
      ? await supabase.from('decor_services').update(datos).eq('id', f.id)
      : await supabase.from('decor_services').insert(datos)
    setGuardando(false)
    if (error) return toast(/duplicate|unique/i.test(error.message) ? 'Ya existe un servicio con ese código' : error.message, 'error')
    toast(f.id ? 'Servicio actualizado' : 'Servicio creado')
    setEditando(null)
    router.refresh()
  }

  async function alternar(s) {
    const { error } = await supabase.from('decor_services').update({ active: !s.active }).eq('id', s.id)
    if (error) return toast(error.message, 'error')
    toast(s.active ? 'Servicio oculto' : 'Servicio visible')
    router.refresh()
  }

  async function confirmarBorrado() {
    setBorrando(true)
    const { error } = await supabase.from('decor_services').delete().eq('id', borrar.id)
    setBorrando(false)
    if (error) return toast(error.message, 'error')
    toast('Servicio eliminado')
    setBorrar(null)
    router.refresh()
  }

  return (
    <div>
      <PageHeader
        title="Decoración"
        description="Servicios que ven los novios en la página de inicio y en su panel para pedir cotización."
        actions={
          <button onClick={nuevo} className="btn-primario btn-sm">
            <Icon name="plus" className="h-4 w-4" /> Nuevo servicio
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-arena-200 bg-white p-3 sm:flex-row sm:items-center">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar servicio" />
        <div className="flex flex-wrap gap-1.5">
          {['', ...categorias].map((c) => (
            <button
              key={c || 'todas'}
              onClick={() => setCategoria(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${categoria === c ? 'bg-cacao text-crema' : 'text-cacao-700 hover:bg-arena'}`}
            >
              {c || 'Todas'}
            </button>
          ))}
        </div>
        <span className="text-xs text-cacao-500 sm:ml-auto">{visibles.length} servicios</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visibles.map((s) => (
          <div key={s.id} className={`group overflow-hidden rounded-2xl border border-arena-200 bg-white ${s.active ? '' : 'opacity-60'}`}>
            <button onClick={() => abrir(s)} className="relative block w-full text-left">
              {s.image_url ? (
                <img src={s.image_url} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-crema">
                  <Icon name="flower" className="h-8 w-8 text-cacao-300" />
                </div>
              )}
              <span className="absolute left-3 top-3">
                <Badge tono={s.price_label === 'A cotizar' ? 'neutro' : 'oscuro'}>{s.price_label}</Badge>
              </span>
              {!s.active && (
                <span className="absolute right-3 top-3">
                  <Badge tono="rojo">Oculto</Badge>
                </span>
              )}
            </button>
            <div className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rosa-600">{s.category}</p>
              <h3 className="mt-1 font-serif text-lg font-semibold leading-snug text-cacao">{s.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-cacao-500">{s.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-arena-200 pt-3">
                <label className="flex items-center gap-2 text-xs text-cacao-700">
                  <Toggle checked={s.active} onChange={() => alternar(s)} label="Visible" /> Visible
                </label>
                <div className="flex gap-1">
                  <button onClick={() => abrir(s)} className="rounded-lg p-2 text-cacao-500 hover:bg-arena hover:text-cacao" title="Editar">
                    <Icon name="edit" className="h-4 w-4" />
                  </button>
                  <button onClick={() => setBorrar(s)} className="rounded-lg p-2 text-cacao-500 hover:bg-rubor-100 hover:text-terracota-800" title="Eliminar">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={nuevo}
          className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-arena-300 text-cacao-500 hover:border-terracota hover:text-terracota"
        >
          <Icon name="plus" className="h-6 w-6" />
          <span className="text-sm font-medium">Agregar servicio</span>
        </button>
      </div>

      <Drawer
        open={!!editando}
        onClose={() => setEditando(null)}
        title={editando?.id ? 'Editar servicio' : 'Nuevo servicio'}
        subtitle="Se muestra en la página de inicio y en el panel de los novios"
        footer={
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-cacao-700">
              <Toggle checked={!!editando?.active} onChange={(v) => setEditando((f) => ({ ...f, active: v }))} label="Visible" />
              {editando?.active ? 'Visible' : 'Oculto'}
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditando(null)} className="btn-claro btn-sm">
                Cancelar
              </button>
              <button type="submit" form="form-servicio" disabled={guardando} className="btn-primario btn-sm">
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        }
      >
        {editando && (
          <form id="form-servicio" onSubmit={guardar} className="space-y-5">
            <ImageUpload value={editando.image_url} onChange={set('image_url')} carpeta="decoracion" contain={false} />
            <Field label="Nombre del servicio">
              <input value={editando.title} onChange={set('title')} className="campo bg-white" placeholder="Arco de globos" autoFocus />
            </Field>
            <Field label="Categoría" hint="Recepción, Ceremonia, Recuerdos, Detalles… o una nueva">
              <input value={editando.category} onChange={set('category')} list="categorias-deco" className="campo bg-white" />
              <datalist id="categorias-deco">
                {categorias.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Descripción">
              <textarea value={editando.description || ''} onChange={set('description')} rows={3} className="campo bg-white" />
            </Field>

            <div className="rounded-2xl border border-arena-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-cacao-500">Precio que se muestra</p>
              <div className="flex rounded-xl border border-arena-300 p-0.5 text-xs font-medium">
                <button type="button" onClick={() => setACotizar(true)} className={`flex-1 rounded-lg px-3 py-2 ${aCotizar ? 'bg-cacao text-crema' : 'text-cacao-700'}`}>
                  A cotizar
                </button>
                <button type="button" onClick={() => setACotizar(false)} className={`flex-1 rounded-lg px-3 py-2 ${!aCotizar ? 'bg-cacao text-crema' : 'text-cacao-700'}`}>
                  Precio desde
                </button>
              </div>
              {!aCotizar && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-cacao-700">Desde S/</span>
                  <input type="number" min="0" value={desde} onChange={(e) => setDesde(e.target.value)} className="campo" placeholder="350" />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Orden" hint="Menor número = aparece primero">
                <input type="number" value={editando.sort_order} onChange={set('sort_order')} className="campo bg-white" />
              </Field>
              <Field label="Código" hint="Se genera del nombre si lo dejas vacío">
                <input value={editando.slug} onChange={set('slug')} className="campo bg-white" placeholder={slugify(editando.title)} />
              </Field>
            </div>
          </form>
        )}
      </Drawer>

      <Confirm
        open={!!borrar}
        title="¿Eliminar este servicio?"
        message={`“${borrar?.title}” dejará de mostrarse. Las solicitudes antiguas que lo incluyen no se modifican. Si solo quieres pausarlo, usa el interruptor “Visible”.`}
        confirmLabel="Eliminar"
        danger
        loading={borrando}
        onConfirm={confirmarBorrado}
        onCancel={() => setBorrar(null)}
      />
    </div>
  )
}
