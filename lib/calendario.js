// Genera archivos de calendario (.ics) que se abren en el celular o en
// Google Calendar: un evento anual por aniversario, con alarma 15 días antes
// (y otra 1 día antes) para enviar el recuerdo.

const pad = (n) => String(n).padStart(2, '0')
const fechaIcs = (iso) => iso.replaceAll('-', '')
const escapar = (t) => String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

function sumarDia(iso) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function evento(c) {
  const ahora = new Date()
  const stamp = `${ahora.getUTCFullYear()}${pad(ahora.getUTCMonth() + 1)}${pad(ahora.getUTCDate())}T${pad(ahora.getUTCHours())}${pad(ahora.getUTCMinutes())}00Z`
  const detalle = [
    `Boda: ${c.fecha_boda}`,
    c.telefono && `Teléfono: ${c.telefono}`,
    c.direccion && `Dirección: ${c.direccion}${c.distrito ? `, ${c.distrito}` : ''}`,
    c.notas && `Notas: ${c.notas}`,
    'Enviar el recuerdo de aniversario de Cherry Bloom Studio y marcarlo como enviado en /admin/aniversarios.',
  ]
    .filter(Boolean)
    .join('\n')
  return [
    'BEGIN:VEVENT',
    `UID:aniversario-${c.id}@cherrybloomstudio`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${fechaIcs(c.proximo)}`,
    `DTEND;VALUE=DATE:${sumarDia(c.proximo)}`,
    'RRULE:FREQ=YEARLY',
    `SUMMARY:${escapar(`💍 Aniversario de ${c.nombres} — enviar recuerdo`)}`,
    `DESCRIPTION:${escapar(detalle)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapar(`En 15 días es el aniversario de ${c.nombres}: prepara su recuerdo`)}`,
    'TRIGGER:-P15D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapar(`Mañana es el aniversario de ${c.nombres}`)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n')
}

export function descargarIcs(clientes, nombreArchivo = 'aniversarios-cherry-bloom.ics') {
  const contenido = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cherry Bloom Studio//Aniversarios//ES', 'CALSCALE:GREGORIAN', ...clientes.map(evento), 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
