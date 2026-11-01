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
      <path d={RASGADO} fill={color} style={{ filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,.12))' }} />
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
  const foto1 = inv.fotos?.[0] || escenario('petalos').url
  const foto2 = inv.fotos?.[1] || inv.fotos?.[0] || escenario('jardin').url
  const hora = horaBonita(inv.hora)
  const sombra = { textShadow: '0 2px 12px rgba(0,0,0,.45)' }

  return (
    <>
      {/* 1 · Portada */}
      <section className="flex min-h-[100svh] flex-col items-center bg-white pb-12 text-center">
        <p className="t-display px-6 pb-4 pt-10 text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--t-text)' }}>
          {invitacion ? `Para ${invitacion.name}` : t.aniversario ? t.eyebrow || 'Celebramos nuestro aniversario' : 'Junto a sus familias'}
        </p>
        <div className="relative w-full max-w-lg">
          <img src={foto1} alt={`${c.bride_name} y ${c.groom_name}`} className="block h-[68svh] max-h-[760px] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-6 px-4 text-white" style={sombra}>
            <p className="t-script text-6xl leading-[0.9] sm:text-7xl">{c.bride_name}</p>
            <p className="t-script -mt-1 text-5xl leading-none sm:text-6xl">&amp;</p>
            <p className="t-script -mt-2 pl-10 text-6xl leading-[0.9] sm:text-7xl">{c.groom_name}</p>
          </div>
          <Rasgado />
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 px-6">
          {f && <p className="t-display text-lg tracking-[0.12em]">{`${f.dia} de ${f.mes} de ${f.anio}`.toUpperCase()}</p>}
          {hora && <p className="t-display text-base tracking-[0.12em]">{hora.toUpperCase()}</p>}
          {inv.frase && <p className="t-muted mt-2 max-w-sm text-sm italic">{inv.frase}</p>}
        </div>
        <div className="mt-6 w-full px-6">
          <div className="mx-auto max-w-sm">
            <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
          </div>
        </div>
      </section>

      {/* 2 · Los detalles */}
      <section className="flex min-h-[100svh] flex-col items-center bg-white pb-14 text-center">
        <div className="relative w-full max-w-lg">
          <img src={foto2} alt="" className="block h-[62svh] max-h-[700px] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-10 text-white" style={sombra}>
            <p className="t-script -mb-3 text-5xl">Los</p>
            <p className="t-display text-5xl tracking-[0.08em] sm:text-6xl">DETALLES</p>
          </div>
          <Rasgado />
        </div>
        <div className="mt-6 flex max-w-sm flex-col items-center gap-1.5 px-6">
          {c.venue && <p className="t-display text-xl tracking-[0.1em]">{c.venue.toUpperCase()}</p>}
          {f && <p className="t-muted text-sm">{f.larga}{hora ? ` · ${hora}` : ''}</p>}
          {inv.hospedaje ? (
            <p className="t-muted mt-2 whitespace-pre-line text-sm italic">{inv.hospedaje}</p>
          ) : (
            <p className="t-muted mt-2 text-sm italic">Escríbannos si necesitan hospedaje cerca.</p>
          )}
        </div>
      </section>

      {/* 3 · RSVP */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-white px-6 py-16 text-center">
        <div aria-hidden="true" className="t-display pointer-events-none absolute inset-y-6 left-1/2 flex -translate-x-1/2 flex-col items-center justify-between leading-none" style={{ color: '#EDEDEA' }}>
          {['R', 'S', 'V', 'P'].map((l) => (
            <span key={l} className="text-[150px] sm:text-[180px]">
              {l}
            </span>
          ))}
        </div>
        <div className="relative flex max-w-sm flex-col items-center gap-3">
          <p className="t-script text-5xl">Confirma</p>
          {limite && <p className="t-script text-3xl">antes del {fechaLarga(limite)}</p>}
          <p className="t-display mt-2 text-xs uppercase tracking-[0.2em]">
            Por favor avísanos si podrás
            <br />
            acompañarnos en {t.aniversario ? 'nuestro aniversario' : 'nuestra boda'}
          </p>
          {invitacion?.passes ? (
            <p className="t-muted text-sm">
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
    </>
  )
}
