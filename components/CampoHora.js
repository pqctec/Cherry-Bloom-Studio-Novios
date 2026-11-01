'use client'

// Selector de hora con a. m. / p. m. explícito (el campo nativo del navegador
// muestra 24 h en algunas computadoras y se presta a confusión).
// Guarda la hora como "HH:MM" en formato 24 h, o '' si está vacía.
const HORAS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTOS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export default function CampoHora({ value, onChange, id, etiqueta = 'Hora' }) {
  const valida = /^\d{2}:\d{2}$/.test(value || '')
  const h24 = valida ? Number(value.slice(0, 2)) : null
  const min = valida ? value.slice(3, 5) : '00'
  const h12 = h24 === null ? '' : h24 % 12 || 12
  const ampm = h24 === null ? 'pm' : h24 < 12 ? 'am' : 'pm'

  function cambiar(nh, nm, np) {
    if (nh === '') return onChange('')
    let h = Number(nh) % 12
    if (np === 'pm') h += 12
    onChange(`${String(h).padStart(2, '0')}:${nm}`)
  }

  const sel = 'campo appearance-none px-2 text-center'
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={etiqueta}>
      <select id={id} aria-label={`${etiqueta}: hora`} value={h12} onChange={(e) => cambiar(e.target.value, min, ampm)} className={`${sel} w-[62px]`}>
        <option value="">--</option>
        {HORAS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-cacao-500">:</span>
      <select
        aria-label={`${etiqueta}: minutos`}
        value={MINUTOS.includes(min) ? min : min}
        onChange={(e) => cambiar(h12 || 12, e.target.value, ampm)}
        disabled={h12 === ''}
        className={`${sel} w-[62px] disabled:opacity-50`}
      >
        {!MINUTOS.includes(min) && <option value={min}>{min}</option>}
        {MINUTOS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <div className="flex overflow-hidden rounded-xl border border-arena-300">
        {[
          ['am', 'a. m.'],
          ['pm', 'p. m.'],
        ].map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => cambiar(h12 || 12, min, v)}
            aria-pressed={ampm === v && h12 !== ''}
            className={`h-11 px-2.5 text-xs font-medium transition ${ampm === v && h12 !== '' ? 'bg-terracota text-crema' : 'bg-white text-cacao-700 hover:bg-arena'}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
