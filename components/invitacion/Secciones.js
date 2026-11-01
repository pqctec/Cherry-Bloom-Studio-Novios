import { horaBonita } from '@/lib/temas'

// Secciones de la invitación después de la portada. Usan los colores del
// modelo (variables --t-*), así combinan con cualquier diseño.

function Titulo({ eyebrow, children }) {
  return (
    <div className="mb-8 text-center">
      {eyebrow && <span className="t-eyebrow">{eyebrow}</span>}
      <h2 className="t-display mt-2 text-4xl leading-tight sm:text-5xl">{children}</h2>
      <div className="mx-auto mt-4 h-px w-16" style={{ background: 'var(--t-accent)' }} />
    </div>
  )
}

export function Mensaje({ texto, firma }) {
  if (!texto) return null
  return (
    <section className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p className="t-display whitespace-pre-line text-2xl italic leading-relaxed sm:text-3xl">“{texto}”</p>
      <p className="t-script t-accent mt-6 text-4xl">{firma}</p>
    </section>
  )
}

export function Foto({ url, nombres }) {
  if (!url) return null
  return (
    <section className="flex justify-center px-6 py-10">
      <div className="w-full max-w-sm overflow-hidden" style={{ borderRadius: '180px 180px 20px 20px', border: '6px solid var(--t-card)', boxShadow: '0 18px 40px rgba(0,0,0,.12)' }}>
        <img src={url} alt={nombres} className="aspect-[4/5] w-full object-cover" />
      </div>
    </section>
  )
}

export function Itinerario({ items }) {
  if (!items?.length) return null
  return (
    <section className="px-6 py-20" style={{ background: 'var(--t-alt)' }}>
      <Titulo eyebrow="El gran día">Itinerario</Titulo>
      <ol className="mx-auto max-w-md">
        {items.map((it, i) => (
          <li key={i} className="relative flex gap-5 pb-8 last:pb-0">
            {i < items.length - 1 && <span className="absolute left-[27px] top-14 h-[calc(100%-56px)] w-px" style={{ background: 'var(--t-line)' }} />}
            <span
              className="t-display flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: 'var(--t-card)', border: '1px solid var(--t-accent)', color: 'var(--t-accent)' }}
            >
              {horaBonita(it.hora).replace(' ', '\u00a0') || it.hora || '•'}
            </span>
            <div className="pt-2">
              <p className="t-display text-2xl leading-tight">{it.titulo}</p>
              {it.lugar && <p className="t-muted mt-1 text-sm">{it.lugar}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function DressCode({ dresscode }) {
  if (!dresscode?.texto && !dresscode?.colores?.length) return null
  return (
    <section className="px-6 py-20 text-center">
      <Titulo eyebrow="Vestimenta">Dress code</Titulo>
      {dresscode.texto && <p className="t-display mx-auto max-w-md text-2xl">{dresscode.texto}</p>}
      {dresscode.colores?.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <span className="t-muted text-sm">Paleta sugerida</span>
          <div className="flex gap-3">
            {dresscode.colores.map((col, i) => (
              <span key={i} className="h-10 w-10 rounded-full" style={{ background: col, border: '1px solid var(--t-line)' }} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export function Ubicacion({ venue, hospedaje }) {
  if (!venue) return null
  const q = encodeURIComponent(venue)
  return (
    <section id="ubicacion" className="px-6 py-20 text-center" style={{ background: 'var(--t-alt)' }}>
      <Titulo eyebrow="Cómo llegar">Ubicación</Titulo>
      <p className="t-display mx-auto max-w-md text-2xl">{venue}</p>
      <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
        <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener" className="t-btn">
          Google Maps
        </a>
        <a href={`https://waze.com/ul?q=${q}&navigate=yes`} target="_blank" rel="noopener" className="t-btn-linea">
          Waze
        </a>
      </div>
      {hospedaje && (
        <div className="t-card mx-auto mt-8 max-w-md px-5 py-5 text-left">
          <span className="t-eyebrow">Hospedaje cercano</span>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{hospedaje}</p>
        </div>
      )}
    </section>
  )
}

export function Credito() {
  return (
    <footer className="px-6 pb-24 pt-10 text-center">
      <p className="t-muted text-xs">
        Invitación hecha con{' '}
        <a href="/" className="underline" style={{ color: 'var(--t-accent)' }}>
          Cherry Bloom Studio · Novios
        </a>{' '}
        — crea la tuya gratis
      </p>
    </footer>
  )
}
