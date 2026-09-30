'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'
import { createClient } from '@/lib/supabase/client'
import { Badge, Confirm, PageHeader, SearchInput, StatCard, fechaCorta, useToast } from '@/components/admin/ui'

function generarClave() {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint32Array(10)
  crypto.getRandomValues(arr)
  return 'Cb-' + Array.from(arr, (n) => letras[n % letras.length]).join('')
}

const FILTROS = [
  ['todas', 'Todas las cuentas'],
  ['pendientes', 'Sin confirmar correo'],
  ['suspendidas', 'Suspendidas'],
  ['sin_boda', 'Sin página de boda'],
  ['admins', 'Administradores'],
]

function haceCuanto(fecha) {
  if (!fecha) return 'Nunca'
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 864e5)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 30) return `Hace ${dias} días`
  return fechaCorta(fecha)
}

export default function UsuariosAdmin({ usuarios, admins, miId, error }) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState('cuentas')
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [confirmar, setConfirmar] = useState(null) // { titulo, mensaje, etiqueta, peligro, accion }
  const [procesando, setProcesando] = useState(false)
  const [nuevoAdmin, setNuevoAdmin] = useState('')
  const [modo, setModo] = useState('crear') // 'crear' cuenta nueva | 'existente' ya tiene cuenta
  const [clave, setClave] = useState('')
  useEffect(() => setClave(generarClave()), []) // solo en el navegador (evita diferencias con el servidor)
  const [creado, setCreado] = useState(null) // { email, clave }

  const supabase = createClient()

  async function ejecutar(fn, args, exito) {
    setProcesando(true)
    const { error } = await supabase.rpc(fn, args)
    setProcesando(false)
    setConfirmar(null)
    if (error) {
      toast?.(error.message, 'error')
      return false
    }
    toast?.(exito)
    router.refresh()
    return true
  }

  const visibles = usuarios.filter((u) => {
    if (busqueda && !`${u.email} ${u.nombres || ''} ${u.slug || ''}`.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtro === 'pendientes') return !u.confirmado
    if (filtro === 'suspendidas') return u.suspendido
    if (filtro === 'sin_boda') return !u.couple_id
    if (filtro === 'admins') return u.es_admin
    return true
  })

  const stats = {
    total: usuarios.length,
    pendientes: usuarios.filter((u) => !u.confirmado).length,
    suspendidas: usuarios.filter((u) => u.suspendido).length,
    admins: admins.length,
  }

  function pedirEliminar(u) {
    setConfirmar({
      titulo: 'Eliminar cuenta',
      mensaje: u.couple_id
        ? `Se eliminará la cuenta ${u.email} y también su página de boda (${u.nombres}), con sus invitaciones, regalos y solicitudes de decoración. Esto no se puede deshacer. Si solo quieres quitarle el acceso, usa "Suspender".`
        : `Se eliminará la cuenta ${u.email}. Esto no se puede deshacer.`,
      etiqueta: 'Sí, eliminar',
      peligro: true,
      accion: () => ejecutar('admin_eliminar_usuario', { p_user: u.id }, 'Cuenta eliminada'),
    })
  }

  function pedirSuspender(u) {
    const suspender = !u.suspendido
    setConfirmar({
      titulo: suspender ? 'Suspender acceso' : 'Reactivar acceso',
      mensaje: suspender
        ? `${u.email} ya no podrá iniciar sesión y se cerrarán sus sesiones abiertas. Su página de boda y sus datos se conservan; puedes reactivarla cuando quieras.`
        : `${u.email} podrá volver a iniciar sesión.`,
      etiqueta: suspender ? 'Suspender' : 'Reactivar',
      peligro: suspender,
      accion: () =>
        ejecutar('admin_suspender_usuario', { p_user: u.id, p_suspender: suspender }, suspender ? 'Acceso suspendido' : 'Acceso reactivado'),
    })
  }

  function pedirQuitarAdmin(email) {
    setConfirmar({
      titulo: 'Quitar administrador',
      mensaje: `${email} dejará de tener acceso a este panel de administración. Su cuenta (si tiene) sigue funcionando normalmente.`,
      etiqueta: 'Quitar acceso',
      peligro: true,
      accion: () => ejecutar('admin_quitar_admin', { p_email: email }, 'Administrador quitado'),
    })
  }

  async function agregarAdmin(e) {
    e.preventDefault()
    if (!nuevoAdmin.trim()) return
    if (modo === 'crear') {
      const email = nuevoAdmin.trim().toLowerCase()
      const ok = await ejecutar('admin_crear_admin', { p_email: email, p_password: clave }, 'Cuenta de administrador creada')
      if (ok) {
        setCreado({ email, clave })
        setNuevoAdmin('')
        setClave(generarClave())
      }
    } else {
      const ok = await ejecutar('admin_agregar_admin', { p_email: nuevoAdmin }, 'Administrador agregado')
      if (ok) setNuevoAdmin('')
    }
  }

  const textoAcceso = creado
    ? `Hola, te di acceso al panel de administración de Cherry Bloom Studio Novios.\n\nEntra en: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\nCorreo: ${creado.email}\nContraseña temporal: ${creado.clave}\n\nAl entrar, cámbiala en "Cambiar contraseña" (abajo a la izquierda).`
    : ''

  const miEmail = usuarios.find((u) => u.id === miId)?.email?.toLowerCase()

  return (
    <div>
      <PageHeader
        title="Usuarios y accesos"
        description="Todas las cuentas registradas en la plataforma. Confirma correos, suspende o elimina accesos y decide quién administra."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-terracota/30 bg-rubor-100 p-4 text-sm text-terracota-800">
          No se pudo cargar la lista: {error}. ¿Ya ejecutaste <b>supabase/migracion_11_usuarios.sql</b> en el SQL Editor?
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cuentas" value={stats.total} icon="users" />
        <StatCard label="Sin confirmar" value={stats.pendientes} sub="no han confirmado su correo" icon="inbox" />
        <StatCard label="Suspendidas" value={stats.suspendidas} icon="lock" />
        <StatCard label="Administradores" value={stats.admins} icon="shield" />
      </div>

      <div className="mb-4 inline-flex rounded-xl border border-arena-200 bg-white p-1">
        {[
          ['cuentas', 'Cuentas'],
          ['admins', 'Administradores'],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === k ? 'bg-cacao text-crema' : 'text-cacao-700 hover:bg-arena'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'cuentas' && (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-arena-200 bg-white p-3 sm:flex-row sm:items-center">
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por correo o nombres" />
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="campo bg-white sm:w-56">
              {FILTROS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <span className="text-xs text-cacao-500 sm:ml-auto">{visibles.length} cuentas</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-arena-200 bg-white">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-arena-200 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-cacao-500">
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3">Boda</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Último ingreso</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena-200/70">
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-sm text-cacao-500">
                      No hay cuentas con ese filtro.
                    </td>
                  </tr>
                )}
                {visibles.map((u) => {
                  const soyYo = u.id === miId
                  const protegido = soyYo || u.es_admin
                  const motivo = soyYo ? 'Es tu cuenta' : 'Primero quítale el rol de administrador'
                  return (
                    <tr key={u.id} className={`hover:bg-crema/60 ${u.suspendido ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="flex flex-wrap items-center gap-1.5 font-medium text-cacao">
                          {u.email}
                          {soyYo && <Badge tono="oscuro">Tú</Badge>}
                          {u.es_admin && !soyYo && <Badge tono="oscuro">Admin</Badge>}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {u.couple_id ? (
                          <>
                            <a href={`/boda/${u.slug}`} target="_blank" className="text-cacao hover:text-terracota hover:underline">
                              {u.nombres}
                            </a>
                            <p className="text-[11px] text-cacao-500">{u.wedding_date ? fechaCorta(u.wedding_date) : 'Sin fecha'}</p>
                          </>
                        ) : (
                          <span className="text-cacao-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-cacao-700">{fechaCorta(u.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-cacao-700">{haceCuanto(u.last_sign_in_at)}</td>
                      <td className="px-4 py-3">
                        {u.suspendido ? (
                          <Badge tono="rojo">Suspendida</Badge>
                        ) : !u.confirmado ? (
                          <Badge tono="alerta">Sin confirmar</Badge>
                        ) : (
                          <Badge tono="ok">Activa</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!u.confirmado && (
                            <button
                              onClick={() =>
                                setConfirmar({
                                  titulo: 'Confirmar correo a mano',
                                  mensaje: `Úsalo si a ${u.email} no le llegó el correo de confirmación. Podrá iniciar sesión de inmediato.`,
                                  etiqueta: 'Confirmar correo',
                                  accion: () => ejecutar('admin_confirmar_usuario', { p_user: u.id }, 'Correo confirmado'),
                                })
                              }
                              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-salvia hover:bg-salvia-100"
                              title="Confirmar correo a mano"
                            >
                              <span className="inline-flex items-center gap-1">
                                <Icon name="check" className="h-3.5 w-3.5" /> Confirmar
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => pedirSuspender(u)}
                            disabled={protegido}
                            className="rounded-lg p-2 text-cacao-500 hover:bg-arena hover:text-terracota disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                            title={protegido ? motivo : u.suspendido ? 'Reactivar acceso' : 'Suspender acceso'}
                          >
                            <Icon name={u.suspendido ? 'unlock' : 'lock'} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => pedirEliminar(u)}
                            disabled={protegido}
                            className="rounded-lg p-2 text-cacao-500 hover:bg-rubor-100 hover:text-terracota-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                            title={protegido ? motivo : 'Eliminar cuenta'}
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-cacao-500">
            <b>Suspender</b> bloquea el inicio de sesión pero conserva la página de boda y sus datos. <b>Eliminar</b> borra la cuenta y todo lo de su
            boda; los clientes de la bitácora de aniversarios se conservan.
          </p>
        </>
      )}

      {tab === 'admins' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-fit overflow-hidden rounded-2xl border border-arena-200 bg-white">
            <ul className="divide-y divide-arena-200/70">
              {admins.map((a) => {
                const soyYo = a.email.toLowerCase() === miEmail
                return (
                  <li key={a.email} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cacao text-crema">
                      <Icon name="shield" className="h-4 w-4" />
                    </span>
                    <div className="min-w-[12rem] flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 font-medium text-cacao">
                        {a.email} {soyYo && <Badge tono="oscuro">Tú</Badge>}
                      </p>
                      <p className="text-[11px] text-cacao-500">
                        Administrador desde {fechaCorta(a.created_at)} ·{' '}
                        {a.registrado ? 'ya tiene cuenta' : 'aún no crea su cuenta'}
                      </p>
                    </div>
                    {!soyYo && (
                      <button onClick={() => pedirQuitarAdmin(a.email)} className="btn-claro btn-sm bg-white text-terracota-800">
                        Quitar acceso
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="h-fit space-y-4">
            {creado && (
              <div className="rounded-2xl border border-salvia/40 bg-salvia-100 p-5">
                <h3 className="font-serif text-lg font-semibold text-cacao">Cuenta creada</h3>
                <p className="mt-1 text-sm text-cacao-700">Envíale estos datos. Esta contraseña no se volverá a mostrar.</p>
                <dl className="mt-3 space-y-1 rounded-xl bg-white p-3 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-cacao-500">Correo</dt><dd className="font-medium text-cacao">{creado.email}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-cacao-500">Contraseña</dt><dd className="font-mono font-medium text-cacao">{creado.clave}</dd></div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(textoAcceso).then(() => toast?.('Copiado'))}
                    className="btn-claro btn-sm bg-white"
                  >
                    <Icon name="copy" className="h-4 w-4" /> Copiar mensaje
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(textoAcceso)}`} target="_blank" className="btn-claro btn-sm bg-white">
                    <Icon name="chat" className="h-4 w-4" /> Enviar por WhatsApp
                  </a>
                  <button type="button" onClick={() => setCreado(null)} className="btn-sm px-3 text-xs text-cacao-500 hover:text-cacao">
                    Listo
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={agregarAdmin} className="rounded-2xl border border-arena-200 bg-white p-5">
              <h3 className="font-serif text-xl font-semibold text-cacao">Agregar administrador</h3>
              <p className="mt-1 text-sm leading-relaxed text-cacao-700">
                Tendrá acceso completo a este panel: catálogo, decoración, solicitudes, parejas, aniversarios y usuarios.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-arena/60 p-1 text-xs font-medium">
                {[
                  ['crear', 'Crear cuenta nueva'],
                  ['existente', 'Ya tiene cuenta'],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setModo(k)}
                    className={`rounded-lg px-2 py-1.5 transition-colors ${modo === k ? 'bg-white text-cacao shadow-sm' : 'text-cacao-700 hover:text-cacao'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="etiqueta">Correo</span>
                <input
                  type="email"
                  value={nuevoAdmin}
                  onChange={(e) => setNuevoAdmin(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="campo bg-white"
                  required
                />
              </label>

              {modo === 'crear' && (
                <label className="mt-3 block">
                  <span className="etiqueta">Contraseña temporal</span>
                  <div className="flex gap-2">
                    <input
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      minLength={8}
                      className="campo bg-white font-mono"
                      required
                    />
                    <button type="button" onClick={() => setClave(generarClave())} className="btn-claro btn-sm shrink-0 bg-white" title="Generar otra">
                      Generar
                    </button>
                  </div>
                </label>
              )}

              <button type="submit" disabled={procesando} className="btn-primario btn-sm mt-4 w-full">
                <Icon name="plus" className="h-4 w-4" /> {modo === 'crear' ? 'Crear cuenta de administrador' : 'Dar acceso de administrador'}
              </button>
              <p className="mt-3 text-[11px] leading-relaxed text-cacao-500">
                {modo === 'crear'
                  ? 'La cuenta queda confirmada y sin página de boda. Si ese correo ya tiene cuenta, solo se le da el acceso y conserva su contraseña.'
                  : 'Para alguien que ya se registró (o lo hará) con ese correo. Al iniciar sesión entrará directo a /admin.'}
              </p>
            </form>
          </div>
        </div>
      )}

      <Confirm
        open={!!confirmar}
        title={confirmar?.titulo}
        message={confirmar?.mensaje}
        confirmLabel={confirmar?.etiqueta}
        danger={confirmar?.peligro}
        loading={procesando}
        onConfirm={() => confirmar?.accion()}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  )
}
