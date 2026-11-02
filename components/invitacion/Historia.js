import CuentaRegresiva from './CuentaRegresiva'
import { escenario } from '@/lib/escenarios'
import { fechaLarga } from '@/lib/invitaciones'

// Modelo PRO "Historia en fotos": pantallas verticales con las fotos de la
// pareja, borde de papel rasgado, nombres en caligrafía y un RSVP de revista.

// Borde de papel rasgado (siempre el mismo dibujo, para que no "salte").
function bordeRasgado(alto = 46) {
  const pts = []
  let x = 0
  let i = 0
  while (x < 400) {
    const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
    pts.push(`${x.toFixed(1)},${(10 + r * (alto - 18)).toFixed(1)}`)
    x += 6 + r * 14
    i++
  }
  pts.push(`400,${alto / 2}`)
  return `M0,${alto} L0,${alto / 2} L${pts.join(' L')} L400,${alto} Z`
}
const RASGADO = bordeRasgado()

function Rasgado({ color = '#FFFFFF' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 46" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px block h-12 w-full">
      <path d={RASGADO} style={{ fill: color, filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,.12))' }} />
    </svg>
  )
}

export function horaBonita(hora) {
  if (!/^\d{2}:\d{2}$/.test(hora || '')) return ''
  const [h, m] = hora.split(':').map(Number)
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

export default function Historia({ c, t, f, inv, invitacion, hayRegalos, limite }) {
  const portadaFoto = inv.fotos?.[0] || escenario('petalos').url
  const fotoDetalles = inv.fotos?.[1] || inv.fotos?.[0] || escenario('jardin').url
  const hora = horaBonita(inv.hora)
  const sombra = { textShadow: '0 2px 12px rgba(0,0,0,.45)' }
  // Todo el modelo toma los colores elegidos: fondo suave (sobre), detalles (sello) y textos (botones).
  const fondo = 'var(--t-alt)'
  const tinta = { color: 'var(--t-boton)' }
  const linea = <span aria-hidden="true" className="mx-auto block h-px w-16" style={{ background: 'var(--t-accent)' }} />

  return (
    <div style={{ background: fondo }}>
      {/* 1 · Portada (video corto o foto) */}
      <section className="flex min-h-[100svh] flex-col items-center pb-12 text-center" style={{ background: fondo }}>
        <p className="t-display px-6 pb-4 pt-10 text-[11px] uppercase tracking-[0.3em]" style={tinta}>
          {invitacion ? `Para ${invitacion.name}` : t.aniversario ? t.eyebrow || 'Celebramos nuestro aniversario' : 'Junto a sus familias'}
        </p>
        <div className="relative w-full max-w-lg">
          {inv.video ? (
            <video src={inv.video} poster={inv.fotos?.[0] || undefined} autoPlay muted loop playsInline preload="auto" className="block h-[68svh] max-h-[760px] w-full object-cover" aria-label={`Video de ${c.bride_name} y ${c.groom_name}`} />
          ) : (
            <img src={portadaFoto} alt={`${c.bride_name} y ${c.groom_name}`} className="block h-[68svh] max-h-[760px] w-full object-cover" />
          )}
          <div className="absolute inset-x-0 bottom-6 px-4 text-white" style={sombra}>
            <p className="t-script text-6xl leading-[0.9] sm:text-7xl">{c.bride_name}</p>
            <p className="t-script -mt-1 text-5xl leading-none sm:text-6xl" style={{ color: 'var(--t-accent)' }}>
              &amp;
            </p>
            <p className="t-script -mt-2 pl-10 text-6xl leading-[0.9] sm:text-7xl">{c.groom_name}</p>
          </div>
          <Rasgado color="var(--t-alt)" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 px-6" style={tinta}>
          {f && <p className="t-display text-lg tracking-[0.12em]">{`${f.dia} de ${f.mes} de ${f.anio}`.toUpperCase()}</p>}
          {linea}
          {hora && <p className="t-display text-base tracking-[0.12em]">{hora.toUpperCase()}</p>}
          {inv.frase && <p className="mt-2 max-w-sm text-sm italic opacity-80">{inv.frase}</p>}
        </div>
        <div className="mt-6 w-full px-6">
          <div className="mx-auto max-w-sm">
            <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
          </div>
        </div>
      </section>

      {/* 2 · Los detalles */}
      <section className="flex min-h-[100svh] flex-col items-center pb-14 text-center" style={{ background: fondo }}>
        <div className="relative w-full max-w-lg">
          <img src={fotoDetalles} alt="" className="block h-[62svh] max-h-[700px] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-10 text-white" style={sombra}>
            <p className="t-script -mb-3 text-5xl" style={{ color: 'var(--t-accent)' }}>
              Los
            </p>
            <p className="t-display text-5xl tracking-[0.08em] sm:text-6xl">DETALLES</p>
          </div>
          <Rasgado color="var(--t-alt)" />
        </div>
        <div className="mt-6 flex max-w-sm flex-col items-center gap-1.5 px-6" style={tinta}>
          {c.venue && <p className="t-display text-xl tracking-[0.1em]">{c.venue.toUpperCase()}</p>}
          {f && <p className="text-sm opacity-80">{f.larga}{hora ? ` · ${hora}` : ''}</p>}
          {linea}
          {inv.hospedaje ? (
            <p className="mt-2 whitespace-pre-line text-sm italic opacity-80">{inv.hospedaje}</p>
          ) : (
            <p className="mt-2 text-sm italic opacity-80">Escríbannos si necesitan hospedaje cerca.</p>
          )}
        </div>
      </section>

      {/* 3 · Itinerario */}
      {inv.itinerario?.some((x) => x.titulo) && (
        <section className="px-6 py-20 text-center" style={{ background: 'color-mix(in srgb, var(--t-soft) 72%, #000000)', color: '#FFFFFF' }}>
          <p className="t-script -mb-2 text-5xl" style={{ color: 'var(--t-accent)' }}>
            El
          </p>
          <p className="t-display text-4xl tracking-[0.1em]">ITINERARIO</p>
          <ol className="mx-auto mt-10 max-w-sm space-y-6 text-left">
            {inv.itinerario.filter((x) => x.titulo).map((it, i) => (
              <li key={i} className="flex items-baseline gap-4 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,.25)' }}>
                <span className="t-display w-24 shrink-0 text-sm tracking-[0.08em]" style={{ color: 'var(--t-accent)' }}>
                  {horaBonita(it.hora).toUpperCase() || '·'}
                </span>
                <span>
                  <span className="t-display block text-lg tracking-[0.06em]">{it.titulo.toUpperCase()}</span>
                  {it.lugar && <span className="block text-sm opacity-80">{it.lugar}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 4 · RSVP */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center" style={{ background: fondo }}>
        <div aria-hidden="true" className="t-display pointer-events-none absolute inset-y-6 left-1/2 flex -translate-x-1/2 flex-col items-center justify-between leading-none" style={{ color: 'var(--t-soft)', opacity: 0.18 }}>
          {['R', 'S', 'V', 'P'].map((l) => (
            <span key={l} className="text-[150px] sm:text-[180px]">
              {l}
            </span>
          ))}
        </div>
        <div className="relative flex max-w-sm flex-col items-center gap-3" style={tinta}>
          <p className="t-script text-5xl">Confirma</p>
          {limite && (
            <p className="t-script text-3xl" style={{ color: 'var(--t-accent)' }}>
              antes del {fechaLarga(limite)}
            </p>
          )}
          <p className="t-display mt-2 text-xs uppercase tracking-[0.2em]">
            Por favor avísanos si podrás
            <br />
            acompañarnos en {t.aniversario ? 'nuestro aniversario' : 'nuestra boda'}
          </p>
          {invitacion?.passes ? (
            <p className="text-sm opacity-80">
              Reservamos {invitacion.passes} {invitacion.passes === 1 ? 'lugar' : 'lugares'} para ustedes
            </p>
          ) : null}
          <div className="mt-4 flex w-full flex-col gap-2.5">
            {invitacion && (
              <a href="#confirmar" className="t-btn w-full">
                {invitacion.status === 'pendiente' ? 'Confirmar asistencia' : 'Ver mi confirmación'}
              </a>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              {c.venue && (
                <a href="#ubicacion" className={`t-btn-linea w-full px-3 ${hayRegalos ? '' : 'col-span-2'}`}>
                  Cómo llegar
                </a>
              )}
              {hayRegalos && (
                <a href="#regalos" className={`t-btn-linea w-full px-3 ${c.venue ? '' : 'col-span-2'}`}>
                  Regalos
                </a>
              )}
            </div>
          </div>
          {inv.contacto && <p className="t-display mt-4 text-xs tracking-[0.15em]">{inv.contacto.toUpperCase()}</p>}
        </div>
      </section>
    </div>
  )
}
