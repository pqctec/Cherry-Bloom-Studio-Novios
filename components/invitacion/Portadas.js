import CuentaRegresiva from './CuentaRegresiva'
import Historia from './Historia'

// Portada (primera pantalla) de cada modelo de invitación.
// Todas reciben lo mismo; solo cambia el diseño.

function Acciones({ invitacion, hayRegalos, venue, centrado = true, sobreFoto = false }) {
  const linea = sobreFoto ? 't-btn-linea !border-white/70 !text-white' : 't-btn-linea'
  return (
    <div className={`flex w-full max-w-sm flex-col gap-2.5 ${centrado ? 'mx-auto' : ''}`}>
      {invitacion && (
        <a href="#confirmar" className="t-btn w-full">
          {invitacion.status === 'pendiente' ? 'Confirmar asistencia' : 'Ver mi confirmación'}
          {invitacion.passes ? ` · ${invitacion.passes} ${invitacion.passes === 1 ? 'pase' : 'pases'}` : ''}
        </a>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {venue && (
          <a href="#ubicacion" className={`${linea} w-full px-3 ${hayRegalos ? '' : 'col-span-2'}`}>
            Cómo llegar
          </a>
        )}
        {hayRegalos && (
          <a href="#regalos" className={`${linea} w-full px-3 ${venue ? '' : 'col-span-2'}`}>
            Regalos
          </a>
        )}
      </div>
    </div>
  )
}

function Saludo({ invitacion, t, className = '' }) {
  if (invitacion) {
    return (
      <p className={`text-lg italic ${className}`} style={{ fontFamily: 'var(--t-display)' }}>
        Querida(o) {invitacion.name}
      </p>
    )
  }
  return <span className={`t-eyebrow ${className}`}>{t.eyebrow}</span>
}

function Pases({ invitacion }) {
  if (!invitacion?.passes) return null
  return (
    <p className="t-muted text-sm">
      Hemos reservado <b style={{ color: 'var(--t-text)' }}>{invitacion.passes}</b> {invitacion.passes === 1 ? 'lugar' : 'lugares'} para ustedes
    </p>
  )
}

const seccion = 'relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-16 text-center'

// ---------------------------------------------------------------------------
function Clasica({ c, t, f, inv, invitacion, hayRegalos, portadaUrl }) {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden text-center">
      <img src={portadaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/70" />
      <div className="relative flex w-full flex-col items-center gap-5 px-6 py-24 text-white">
        {invitacion ? (
          <span className="font-serif text-xl italic text-rubor sm:text-2xl">Querida(o) {invitacion.name}</span>
        ) : (
          <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-white/80">{t.eyebrow}</span>
        )}
        <h1 className="font-script text-6xl leading-tight sm:text-8xl">
          {c.bride_name}
          <span className="mx-3 font-serif text-4xl italic text-rubor sm:text-6xl">&amp;</span>
          {c.groom_name}
        </h1>
        {inv.frase && <p className="max-w-md font-serif text-xl italic text-white/90">{inv.frase}</p>}
        {(f || c.venue) && (
          <p className="font-serif text-xl sm:text-2xl">
            {f?.larga}
            {inv.hora ? ` · ${inv.hora}` : ''}
            {c.venue ? <span className="block text-lg text-white/85">{c.venue}</span> : null}
          </p>
        )}
        {invitacion?.passes ? (
          <p className="rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm backdrop-blur-md">
            Hemos reservado <b>{invitacion.passes}</b> {invitacion.passes === 1 ? 'lugar' : 'lugares'} para ustedes
          </p>
        ) : null}
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} variante="foto" />
        <div className="mt-2 w-full">
          <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} sobreFoto />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function Jardin({ c, t, f, inv, invitacion, hayRegalos }) {
  return (
    <section className={seccion}>
      <svg aria-hidden="true" viewBox="0 0 390 190" preserveAspectRatio="xMidYMin slice" className="absolute inset-x-0 top-0 h-48 w-full">
        <circle cx="30" cy="40" r="44" fill="var(--t-soft)" opacity="0.45" />
        <circle cx="70" cy="18" r="26" fill="var(--t-soft)" opacity="0.7" />
        <circle cx="10" cy="88" r="24" fill="#C9D6B8" opacity="0.7" />
        <circle cx="360" cy="38" r="46" fill="var(--t-soft)" opacity="0.45" />
        <circle cx="322" cy="14" r="24" fill="var(--t-soft)" opacity="0.7" />
        <circle cx="382" cy="90" r="22" fill="#C9D6B8" opacity="0.7" />
        <path d="M80 62 C120 72 130 42 170 48" stroke="#9FB08A" strokeWidth="1.5" fill="none" />
        <path d="M310 64 C270 74 260 44 220 50" stroke="#9FB08A" strokeWidth="1.5" fill="none" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 390 120" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-28 w-full">
        <circle cx="20" cy="110" r="40" fill="var(--t-soft)" opacity="0.35" />
        <circle cx="372" cy="104" r="44" fill="var(--t-soft)" opacity="0.35" />
        <circle cx="340" cy="118" r="20" fill="#C9D6B8" opacity="0.6" />
      </svg>
      <div className="relative flex w-full max-w-md flex-col items-center gap-5">
        <Saludo invitacion={invitacion} t={t} />
        <h1 className="t-script t-accent text-7xl leading-[0.95] sm:text-8xl">
          {c.bride_name}
          <br />&amp; {c.groom_name}
        </h1>
        {inv.frase && <p className="t-display text-xl italic">“{inv.frase}”</p>}
        {f && (
          <div className="flex items-center gap-3">
            <span className="h-px w-10" style={{ background: 'var(--t-line)' }} />
            <span className="t-display text-xl font-semibold capitalize">
              {f.diaSemana} {f.dia} · {f.mes} · {f.anio}
            </span>
            <span className="h-px w-10" style={{ background: 'var(--t-line)' }} />
          </div>
        )}
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
        {c.venue && (
          <div>
            <p className="t-eyebrow">{inv.hora ? `${inv.hora} · ` : ''}Ceremonia y recepción</p>
            <p className="t-display mt-1 text-2xl font-semibold">{c.venue}</p>
          </div>
        )}
        <Pases invitacion={invitacion} />
        <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function BlackTie({ c, t, f, inv, invitacion, hayRegalos }) {
  return (
    <section className="flex min-h-[100svh] items-center justify-center px-4 py-6">
      <div className="flex w-full max-w-lg p-1.5" style={{ border: '1px solid var(--t-accent)' }}>
        <div className="flex w-full flex-col items-center gap-5 px-5 py-12 text-center" style={{ border: '1px solid var(--t-accent)' }}>
          <svg aria-hidden="true" width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="var(--t-accent)" strokeWidth="1.2">
            <path d="M60 4 L72 20 L60 36 L48 20 Z" />
            <path d="M60 12 L66 20 L60 28 L54 20 Z" />
            <path d="M2 20 H44 M76 20 H118" />
            <circle cx="40" cy="20" r="2" />
            <circle cx="80" cy="20" r="2" />
          </svg>
          {invitacion ? (
            <p className="t-display text-xs tracking-[0.35em]" style={{ color: 'var(--t-accent)' }}>
              {invitacion.name.toUpperCase()}
            </p>
          ) : (
            <p className="t-display text-[11px] tracking-[0.4em]" style={{ color: 'var(--t-accent)' }}>
              {t.eyebrow.toUpperCase()}
            </p>
          )}
          <h1 className="t-display text-4xl leading-tight tracking-[0.06em] sm:text-5xl">{c.bride_name.toUpperCase()}</h1>
          <span className="text-3xl italic leading-none" style={{ color: 'var(--t-accent)' }}>
            &amp;
          </span>
          <h1 className="t-display -mt-2 text-4xl leading-tight tracking-[0.06em] sm:text-5xl">{c.groom_name.toUpperCase()}</h1>
          <p className="t-muted text-lg italic">{inv.frase || t.invitamos}</p>
          {f && (
            <div className="grid w-full grid-cols-3 items-center py-4" style={{ borderTop: '1px solid var(--t-line)', borderBottom: '1px solid var(--t-line)' }}>
              <span className="t-display text-xs tracking-[0.2em]">{f.diaSemana.toUpperCase()}</span>
              <span className="t-display text-5xl leading-none" style={{ color: 'var(--t-accent)' }}>
                {f.dia}
              </span>
              <span className="t-display text-xs tracking-[0.2em]">
                {f.mesCorto.toUpperCase()} {f.anio}
              </span>
            </div>
          )}
          {c.venue && (
            <p className="text-xl leading-snug">
              {c.venue}
              {inv.hora ? <span className="t-muted block text-lg">{inv.hora}</span> : null}
            </p>
          )}
          <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
          <Pases invitacion={invitacion} />
          <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function Boho({ c, t, f, inv, invitacion, hayRegalos }) {
  return (
    <section className={seccion}>
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        <div
          className="relative flex w-full max-w-[320px] flex-col items-center justify-center gap-2 overflow-hidden px-6 pb-10 pt-20"
          style={{ background: 'var(--t-accent)', color: 'var(--t-on-accent)', borderRadius: '160px 160px 18px 18px', minHeight: 380 }}
        >
          <svg aria-hidden="true" viewBox="0 0 300 120" className="absolute left-0 top-3 w-full" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55">
            <path d="M150 110 C140 70 120 40 90 20 M120 50 l-14 -6 M110 38 l-14 -4 M128 62 l-14 -8 M100 28 l-12 -2" />
            <path d="M150 110 C160 70 180 40 210 20 M180 50 l14 -6 M190 38 l14 -4 M172 62 l14 -8 M200 28 l12 -2" />
          </svg>
          <span className="relative text-[11px] uppercase tracking-[0.35em] opacity-90">{invitacion ? invitacion.name : t.eyebrow}</span>
          <h1 className="t-script relative text-6xl leading-[0.95] sm:text-7xl">
            {c.bride_name}
            <br />&amp; {c.groom_name}
          </h1>
          {f && (
            <p className="t-display relative mt-1 text-2xl tracking-[0.08em]">
              {f.dd} · {f.mm} · {f.anio}
            </p>
          )}
        </div>
        {inv.frase && <p className="t-display text-xl leading-snug">{inv.frase}</p>}
        {c.venue && (
          <p className="text-base">
            {c.venue}
            {inv.hora ? <span className="t-muted"> · {inv.hora}</span> : null}
          </p>
        )}
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
        <Pases invitacion={invitacion} />
        <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function Editorial({ c, t, f, inv, invitacion, hayRegalos }) {
  return (
    <section className="flex min-h-[100svh] items-center justify-center px-6 py-14">
      <div className="flex w-full max-w-md flex-col gap-6 text-left">
        <div className="flex justify-between text-[11px] uppercase tracking-[0.25em]">
          <span>{invitacion ? `Para ${invitacion.name}` : t.aniversario ? 'El aniversario de' : 'La boda de'}</span>
          <span>{f ? f.anio : ''}</span>
        </div>
        <h1 className="t-display text-6xl leading-[0.98] tracking-tight sm:text-7xl">
          {c.bride_name}
          <br />
          <em style={{ color: 'var(--t-accent)' }}>y</em> {c.groom_name}
        </h1>
        {f && (
          <div className="t-display text-[96px] font-semibold leading-[0.85] tracking-[-0.04em] sm:text-[120px]">
            {f.dd}.{f.mm}
            <br />.{f.aa}
          </div>
        )}
        <div className="h-px" style={{ background: 'var(--t-text)' }} />
        {inv.frase && <p className="t-display text-xl italic">{inv.frase}</p>}
        <div className="grid grid-cols-2 gap-5 text-sm leading-relaxed">
          {c.venue && (
            <div>
              <span className="t-eyebrow">Dónde</span>
              {c.venue}
            </div>
          )}
          {f && (
            <div>
              <span className="t-eyebrow">Cuándo</span>
              <span className="capitalize">{f.diaSemana}</span>
              {inv.hora ? `, ${inv.hora}` : ''}
            </div>
          )}
          {t.bodas && (
            <div>
              <span className="t-eyebrow">Celebramos</span>
              {t.bodas}
            </div>
          )}
          {invitacion?.passes ? (
            <div>
              <span className="t-eyebrow">Pases</span>
              {invitacion.passes} {invitacion.passes === 1 ? 'lugar' : 'lugares'}
            </div>
          ) : null}
        </div>
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
        <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} centrado={false} />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function Mar({ c, t, f, inv, invitacion, hayRegalos }) {
  return (
    <section className="flex min-h-[100svh] flex-col text-center">
      <div className="relative flex flex-col items-center gap-3 px-6 pt-16" style={{ background: 'var(--t-accent)', color: 'var(--t-on-accent)' }}>
        <svg aria-hidden="true" width="64" height="40" viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="32" cy="22" r="12" />
          <path d="M32 2v4M14 22H8M56 22h-6M19 9l3 3M45 9l-3 3" />
        </svg>
        <span className="text-[11px] uppercase tracking-[0.35em]">{invitacion ? `Querida(o) ${invitacion.name}` : t.eyebrow}</span>
        <h1 className="t-script text-6xl leading-[0.95] sm:text-7xl">
          {c.bride_name} &amp; {c.groom_name}
        </h1>
        <p className="t-display mb-8 text-lg italic opacity-95">{inv.frase || (t.aniversario ? 'con el mar como testigo, otra vez' : 'al atardecer, con los pies en la arena')}</p>
        <svg aria-hidden="true" viewBox="0 0 390 56" preserveAspectRatio="none" className="block h-14 w-[calc(100%+3rem)]">
          <path d="M0 20 C 50 0, 90 40, 140 20 S 240 0, 290 20 S 360 40, 390 18 V56 H0 Z" fill="var(--t-soft)" opacity="0.6" />
          <path d="M0 34 C 60 14, 110 52, 170 32 S 280 14, 330 34 S 380 44, 390 30 V56 H0 Z" fill="var(--t-bg)" />
        </svg>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-5 px-6 pb-14 pt-4">
        {f && (
          <div className="t-display flex items-baseline justify-center gap-3">
            <span className="text-lg capitalize">{f.diaSemana}</span>
            <span className="text-6xl font-semibold" style={{ color: 'var(--t-accent)' }}>
              {f.dia}
            </span>
            <span className="text-lg">
              {f.mes} {f.anio}
            </span>
          </div>
        )}
        {c.venue && (
          <div className="t-card w-full px-4 py-4">
            <span className="t-eyebrow">{inv.hora ? `${inv.hora} · ` : ''}Lugar</span>
            <p className="t-display mt-1 text-xl">{c.venue}</p>
          </div>
        )}
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
        <Pases invitacion={invitacion} />
        <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function Olivo({ c, t, f, inv, invitacion, hayRegalos }) {
  return (
    <section className={seccion}>
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        <svg aria-hidden="true" width="220" height="70" viewBox="0 0 220 70" fill="none" stroke="var(--t-accent)" strokeWidth="1.3" strokeLinecap="round">
          <path d="M10 50 C70 50 150 50 210 50" />
          <path d="M40 50 q8 -18 22 -20 q-4 16 -22 20z M70 50 q10 -22 26 -22 q-6 18 -26 22z M110 50 q8 -24 24 -26 q-4 20 -24 26z M150 50 q10 -20 26 -20 q-6 16 -26 20z" />
          <path d="M60 50 q-6 14 -20 16 q4 -12 20 -16z M100 50 q-6 14 -20 16 q4 -12 20 -16z M140 50 q-6 14 -20 16 q4 -12 20 -16z" />
          <circle cx="186" cy="44" r="4" />
          <circle cx="194" cy="54" r="3.5" />
        </svg>
        <span className="text-sm uppercase tracking-[0.3em] t-muted">{invitacion ? invitacion.name : t.aniversario ? t.eyebrow : 'Junto a nuestras familias'}</span>
        <h1 className="t-script t-accent text-6xl leading-[1.05] sm:text-7xl">
          {c.bride_name}
          <br />y {c.groom_name}
        </h1>
        <p className="text-xl italic leading-snug">{inv.frase || (t.aniversario ? 'los invitamos a celebrar los años que llevamos juntos' : 'los invitamos a compartir el día en que unimos nuestras vidas')}</p>
        {f && (
          <div className="flex items-center gap-5 text-lg">
            <span className="capitalize">{f.diaSemana}</span>
            <span className="flex h-16 w-16 flex-col items-center justify-center rounded-full leading-none" style={{ border: '1px solid var(--t-accent)' }}>
              <b className="text-2xl font-medium">{f.dia}</b>
              <span className="text-[11px] uppercase tracking-[0.15em]">{f.mesCorto}</span>
            </span>
            <span>{f.anio}</span>
          </div>
        )}
        {c.venue && (
          <p className="text-lg">
            {c.venue}
            {inv.hora ? <span className="t-muted"> · {inv.hora}</span> : null}
          </p>
        )}
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
        <Pases invitacion={invitacion} />
        <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
export function FranjaAndina({ alto = 54 }) {
  return (
    <svg aria-hidden="true" width="100%" height={alto} className="block">
      <defs>
        <pattern id="tejido-andino" width="40" height="54" patternUnits="userSpaceOnUse">
          <rect width="40" height="54" fill="var(--t-accent)" />
          <rect y="0" width="40" height="6" fill="#E3A82B" />
          <rect y="48" width="40" height="6" fill="#1F7A72" />
          <path d="M20 12 L32 27 L20 42 L8 27 Z" fill="#E3A82B" />
          <path d="M20 19 L26 27 L20 35 L14 27 Z" fill="#1F7A72" />
          <path d="M0 27 L6 20 L6 34 Z M40 27 L34 20 L34 34 Z" fill="#F4E4C8" />
        </pattern>
      </defs>
      <rect width="100%" height={alto} fill="url(#tejido-andino)" />
    </svg>
  )
}

function Andino({ c, t, f, inv, invitacion, hayRegalos }) {
  return (
    <section className="flex min-h-[100svh] flex-col text-center">
      <FranjaAndina />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6 py-12">
        <span className="text-[11px] uppercase tracking-[0.35em]" style={{ color: 'var(--t-accent)' }}>
          {invitacion ? `Querida(o) ${invitacion.name}` : t.aniversario ? t.eyebrow : 'Kuyanakuy · nos queremos'}
        </span>
        <h1 className="t-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
          {c.bride_name}
          <br />
          <span className="font-normal italic" style={{ color: 'var(--t-accent)' }}>
            &amp;
          </span>{' '}
          {c.groom_name}
        </h1>
        <p className="t-display text-lg italic leading-snug">{inv.frase || 'Bajo la mirada de los Apus, celebremos nuestro amor'}</p>
        {f && (
          <div className="t-display flex items-center gap-4">
            <span className="text-sm tracking-[0.1em]">{f.diaSemana.slice(0, 3).toUpperCase()}</span>
            <span className="text-5xl font-semibold leading-none" style={{ color: 'var(--t-accent)' }}>
              {f.dia}
            </span>
            <span className="text-left text-sm tracking-[0.1em]">
              {f.mes.toUpperCase()}
              <br />
              {f.anio}
            </span>
          </div>
        )}
        {c.venue && (
          <div className="t-card w-full px-4 py-4" style={{ borderWidth: 1.5 }}>
            <span className="t-eyebrow">{inv.hora ? `${inv.hora} · ` : ''}Lugar</span>
            <p className="t-display mt-1 text-xl">{c.venue}</p>
          </div>
        )}
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
        <Pases invitacion={invitacion} />
        <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} />
      </div>
      <FranjaAndina alto={18} />
    </section>
  )
}

// ---------------------------------------------------------------------------
function SobreSello({ c, t, f, inv, invitacion, hayRegalos, iniciales }) {
  return (
    <section className="flex min-h-[100svh] items-center justify-center px-5 py-12" style={{ background: 'var(--t-alt)' }}>
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl px-6 pb-8 pt-10 text-center" style={{ background: 'var(--t-card)', boxShadow: '0 18px 40px rgba(74,50,41,.16)' }}>
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-[22px]"
          style={{ background: 'var(--t-accent)', color: 'var(--t-on-accent)', fontFamily: '"Great Vibes", cursive' }}
        >
          {iniciales}
        </span>
        <span className="t-eyebrow">{invitacion ? `Querida(o) ${invitacion.name}` : t.eyebrow}</span>
        <h1 className="t-script text-6xl leading-none">
          {c.bride_name} &amp; {c.groom_name}
        </h1>
        <p className="t-display text-xl leading-snug">
          {inv.frase || t.invitamos.replace('tienen', 'Tenemos').replace('invitarle', 'invitarte')}
          {f && (
            <>
              <br />
              <b>{f.larga}</b>
            </>
          )}
          {c.venue && (
            <>
              <br />
              {c.venue}
              {inv.hora ? ` · ${inv.hora}` : ''}
            </>
          )}
        </p>
        <CuentaRegresiva fecha={c.wedding_date} hora={inv.hora} />
        <Pases invitacion={invitacion} />
        <Acciones invitacion={invitacion} hayRegalos={hayRegalos} venue={c.venue} />
      </div>
    </section>
  )
}

const PORTADAS = {
  clasica: Clasica,
  jardin: Jardin,
  blacktie: BlackTie,
  boho: Boho,
  editorial: Editorial,
  mar: Mar,
  olivo: Olivo,
  andino: Andino,
  sobre: SobreSello,
  historia: Historia,
}

export default function Portada(props) {
  const P = PORTADAS[props.inv.modelo] || Clasica
  return <P {...props} />
}
