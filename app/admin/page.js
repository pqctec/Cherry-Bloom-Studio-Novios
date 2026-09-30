import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Icon from '@/components/Icon'
import { StatCard, Badge, PageHeader } from '@/components/admin/ui'
import { fechaCorta } from '@/components/admin/utils'
import { soles } from '@/lib/escenarios'

export default async function AdminResumen() {
  const supabase = await createServerSupabaseClient()
  const [{ data: r }, { data: solicitudes }, { data: parejas }] = await Promise.all([
    supabase.rpc('admin_resumen'),
    supabase.rpc('admin_solicitudes'),
    supabase.rpc('admin_parejas'),
  ])
  const res = r || {}
  const ultimas = (solicitudes || []).slice(0, 5)
  const proximas = (parejas || [])
    .filter((p) => p.wedding_date && new Date(p.wedding_date + 'T00:00:00') >= new Date(new Date().toDateString()))
    .sort((a, b) => a.wedding_date.localeCompare(b.wedding_date))
    .slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Resumen"
        description="Cómo va Cherry Bloom Studio Novios: parejas, regalos y solicitudes de decoración."
        actions={
          <>
            <Link href="/admin/regalos" className="btn-claro btn-sm bg-white">
              <Icon name="plus" className="h-4 w-4" /> Nuevo regalo
            </Link>
            <Link href="/admin/decoracion" className="btn-primario btn-sm">
              <Icon name="plus" className="h-4 w-4" /> Nuevo servicio
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Parejas registradas" value={res.parejas ?? 0} sub={`${res.parejas_mes ?? 0} este mes · ${res.proximas_bodas ?? 0} bodas en 90 días`} icon="rings" />
        <StatCard label="Solicitudes nuevas" value={res.solicitudes_nuevas ?? 0} sub={`${res.solicitudes_total ?? 0} solicitudes en total`} icon="inbox" />
        <StatCard label="Regalos elegidos" value={res.regalos_elegidos ?? 0} sub={`${soles(res.ventas_regalos)} en regalos`} icon="gift" />
        <StatCard label="Margen estimado" value={soles(res.margen_estimado)} sub="10 % sobre regalos elegidos" icon="trend" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Productos activos" value={`${res.productos_activos ?? 0}/${res.productos_total ?? 0}`} sub="en el catálogo de regalos" />
        <StatCard label="Servicios de decoración" value={res.servicios_activos ?? 0} sub="visibles para los novios" />
        <StatCard label="Aportes a fondos" value={soles(res.fondos_recaudados)} sub={`${res.confirmaciones ?? 0} invitados confirmados en total`} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <section className="rounded-2xl border border-arena-200 bg-white">
          <div className="flex items-center justify-between border-b border-arena-200 px-5 py-4">
            <h2 className="font-serif text-xl font-semibold text-cacao">Últimas solicitudes de decoración</h2>
            <Link href="/admin/solicitudes" className="text-xs font-medium text-terracota hover:underline">
              Ver todas
            </Link>
          </div>
          {ultimas.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-cacao-500">Todavía no hay solicitudes.</p>
          ) : (
            <ul className="divide-y divide-arena-200">
              {ultimas.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cacao">
                      {s.bride_name} &amp; {s.groom_name}
                      <span className="ml-2 text-xs font-normal text-cacao-500">boda {fechaCorta(s.wedding_date)}</span>
                    </p>
                    <p className="mt-1 truncate text-xs text-cacao-500">{s.services.join(' · ')}</p>
                  </div>
                  <Badge tono={s.status === 'nueva' ? 'rojo' : s.status === 'aceptada' ? 'ok' : s.status === 'cotizada' ? 'alerta' : 'neutro'}>
                    {s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-arena-200 bg-white">
            <div className="border-b border-arena-200 px-5 py-4">
              <h2 className="font-serif text-xl font-semibold text-cacao">Próximas bodas</h2>
            </div>
            {proximas.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-cacao-500">Sin bodas próximas con fecha.</p>
            ) : (
              <ul className="divide-y divide-arena-200">
                {proximas.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-cacao">
                        {p.bride_name} &amp; {p.groom_name}
                      </p>
                      <p className="text-xs text-cacao-500">
                        {fechaCorta(p.wedding_date)} · {p.personas} asistentes
                      </p>
                    </div>
                    <a href={`/boda/${p.slug}`} target="_blank" className="text-cacao-300 hover:text-terracota" aria-label="Ver página">
                      <Icon name="external" className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-arena-200 bg-white">
            <div className="border-b border-arena-200 px-5 py-4">
              <h2 className="font-serif text-xl font-semibold text-cacao">Regalos más elegidos</h2>
            </div>
            {(res.top_regalos || []).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-cacao-500">Aún ninguna pareja eligió regalos.</p>
            ) : (
              <ul className="divide-y divide-arena-200">
                {res.top_regalos.map((t) => (
                  <li key={t.title} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-crema">
                      {t.image_url && <img src={t.image_url} alt="" className="h-full w-full object-contain p-1" />}
                    </span>
                    <span className="flex-1 truncate text-sm text-cacao">{t.title}</span>
                    <span className="text-xs font-medium text-cacao-500">{t.veces} listas</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
