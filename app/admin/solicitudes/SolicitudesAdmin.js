'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import { createClient } from '@/lib/supabase/client'
import { Badge, Drawer, Field, PageHeader, SearchInput, fechaCorta, useToast } from '@/components/admin/ui'

const ESTADOS = [
  { id: 'nueva', label: 'Nuevas', tono: 'rojo' },
  { id: 'cotizada', label: 'Cotizadas', tono: 'alerta' },
  { id: 'aceptada', label: 'Aceptadas', tono: 'ok' },
  { id: 'descartada', label: 'Descartadas', tono: 'neutro' },
]
const tonoDe = (s) => ESTADOS.find((e) => e.id === s)?.tono || 'neutro'
const etiquetaDe = (s) => ({ nueva: 'Nueva', cotizada: 'Cotizada', aceptada: 'Aceptada', descartada: 'Descartada' })[s] || s

function whatsapp(tel, texto) {
  const digitos = String(tel || '').replace(/\D/g, '')
  if (!digitos) return null
  const numero = digitos.length === 9 ? `51${digitos}` : digitos
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export default function SolicitudesAdmin({ solicitudes }) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const [filtro, setFiltro] = useState('nueva')
  const [busqueda, setBusqueda] = useState('')
  const [abierta, setAbierta] = useState(null)
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const conteo = Object.fromEntries(ESTADOS.map((e) => [e.id, solicitudes.filter((s) => s.status === e.id).length]))
  const visibles = solicitudes.filter(
    (s) =>
      (filtro === 'todas' || s.status === filtro) &&
      (!busqueda || `${s.bride_name} ${s.groom_name} ${s.email || ''} ${s.services.join(' ')}`.toLowerCase().includes(busqueda.toLowerCase()))
  )

  function abrir(s) {
    setAbierta(s)
    setNotas(s.admin_notes || '')
  }

  async function actualizar(cambios, mensaje) {
    setGuardando(true)
    const { error } = await supabase.from('decor_requests').update(cambios).eq('id', abierta.id)
    setGuardando(false)
    if (error) return toast(error.message, 'error')
    setAbierta((a) => ({ ...a, ...cambios }))
    toast(mensaje)
    router.refresh()
  }

  const saludo = abierta
    ? `¡Hola ${abierta.bride_name} y ${abierta.groom_name}! Les escribimos de Cherry Bloom Studio por su solicitud de decoración (${abierta.services.join(', ')}). `
    : ''
  const linkWa = abierta ? whatsapp(abierta.contact_phone, saludo) : null

  return (
    <div>
      <PageHeader title="Solicitudes de decoración" description="Lo que piden los novios desde su panel. Cambia el estado y los novios lo verán en su cuenta." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-arena-200 bg-white p-1.5">
          {[...ESTADOS, { id: 'todas', label: 'Todas' }].map((e) => (
            <button
              key={e.id}
              onClick={() => setFiltro(e.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${filtro === e.id ? 'bg-cacao text-crema' : 'text-cacao-700 hover:bg-arena'}`}
            >
              {e.label}
              <span className={`rounded-full px-1.5 text-[10px] ${filtro === e.id ? 'bg-crema/20' : 'bg-arena'}`}>
                {e.id === 'todas' ? solicitudes.length : conteo[e.id]}
              </span>
            </button>
          ))}
        </div>
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar pareja o servicio" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-arena-200 bg-white">
        {visibles.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Icon name="inbox" className="mx-auto h-8 w-8 text-cacao-300" />
            <p className="mt-3 text-sm text-cacao-500">No hay solicitudes en esta vista.</p>
          </div>
        ) : (
          <ul className="divide-y divide-arena-200">
            {visibles.map((s) => (
              <li key={s.id}>
                <button onClick={() => abrir(s)} className="flex w-full flex-col gap-2 px-5 py-4 text-left hover:bg-crema/60 sm:flex-row sm:items-center sm:gap-6">
                  <div className="sm:w-56">
                    <p className="font-medium text-cacao">
                      {s.bride_name} &amp; {s.groom_name}
                    </p>
                    <p className="text-xs text-cacao-500">Recibida {fechaCorta(s.created_at)}</p>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {s.services.slice(0, 4).map((x) => (
                      <Badge key={x}>{x}</Badge>
                    ))}
                    {s.services.length > 4 && <Badge tono="oscuro">+{s.services.length - 4}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-cacao-500 sm:w-64 sm:justify-end">
                    <span>
                      <Icon name="calendar" className="mr-1 inline h-3.5 w-3.5" />
                      {fechaCorta(s.wedding_date)}
                    </span>
                    <span>
                      <Icon name="users" className="mr-1 inline h-3.5 w-3.5" />
                      {s.guests_estimate || '—'}
                    </span>
                    <Badge tono={tonoDe(s.status)}>{etiquetaDe(s.status)}</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Drawer
        open={!!abierta}
        onClose={() => setAbierta(null)}
        title={abierta ? `${abierta.bride_name} & ${abierta.groom_name}` : ''}
        subtitle={abierta ? `Solicitud recibida el ${fechaCorta(abierta.created_at)}` : ''}
      >
        {abierta && (
          <div className="space-y-6">
            <div>
              <p className="etiqueta">Estado</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ESTADOS.map((e) => (
                  <button
                    key={e.id}
                    disabled={guardando}
                    onClick={() => actualizar({ status: e.id }, `Marcada como ${etiquetaDe(e.id).toLowerCase()}`)}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      abierta.status === e.id ? 'border-cacao bg-cacao text-crema' : 'border-arena-300 bg-white text-cacao-700 hover:bg-arena'
                    }`}
                  >
                    {etiquetaDe(e.id)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-arena-200 bg-white p-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-cacao-500">Fecha de boda</p>
                <p className="mt-0.5 font-medium text-cacao">{fechaCorta(abierta.wedding_date)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-cacao-500">Invitados aprox.</p>
                <p className="mt-0.5 font-medium text-cacao">{abierta.guests_estimate || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] uppercase tracking-[0.15em] text-cacao-500">Lugar</p>
                <p className="mt-0.5 font-medium text-cacao">{abierta.venue || 'Por definir'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-cacao-500">WhatsApp</p>
                <p className="mt-0.5 font-medium text-cacao">{abierta.contact_phone || '—'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.15em] text-cacao-500">Correo</p>
                <p className="mt-0.5 truncate font-medium text-cacao">{abierta.email || '—'}</p>
              </div>
            </div>

            <div>
              <p className="etiqueta">Servicios solicitados</p>
              <ul className="divide-y divide-arena-200 rounded-2xl border border-arena-200 bg-white">
                {abierta.services.map((x) => (
                  <li key={x} className="flex items-center gap-2 px-4 py-2.5 text-sm text-cacao">
                    <Icon name="check" className="h-4 w-4 text-salvia" /> {x}
                  </li>
                ))}
              </ul>
            </div>

            {abierta.notes && (
              <div>
                <p className="etiqueta">Estilo e ideas de los novios</p>
                <p className="rounded-2xl bg-rubor-100/60 px-4 py-3 text-sm italic text-cacao-700">“{abierta.notes}”</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {linkWa ? (
                <a href={linkWa} target="_blank" rel="noreferrer" className="btn-primario btn-sm">
                  <Icon name="chat" className="h-4 w-4" /> Escribir por WhatsApp
                </a>
              ) : (
                <span className="text-xs text-cacao-500">No dejaron WhatsApp.</span>
              )}
              {abierta.email && (
                <a href={`mailto:${abierta.email}?subject=${encodeURIComponent('Cotización de decoración · Cherry Bloom Studio')}`} className="btn-claro btn-sm bg-white">
                  Enviar correo
                </a>
              )}
              <a href={`/boda/${abierta.slug}`} target="_blank" className="btn-claro btn-sm bg-white">
                <Icon name="external" className="h-4 w-4" /> Ver su página
              </a>
            </div>

            <Field label="Notas internas" hint="Solo las ves tú: monto cotizado, acuerdos, pendientes…">
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} className="campo bg-white" />
            </Field>
            <button
              onClick={() => actualizar({ admin_notes: notas.trim() || null }, 'Notas guardadas')}
              disabled={guardando || notas === (abierta.admin_notes || '')}
              className="btn-primario btn-sm"
            >
              Guardar notas
            </button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
