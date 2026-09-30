// Utilidades para los links personales de invitación.

// Usa el dominio desde el que se abre el panel (en Vercel será el dominio
// real; en tu PC, localhost). Así el link siempre apunta al sitio correcto.
export function baseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
}

export function linkInvitacion(slug, code) {
  return `${baseUrl()}/boda/${slug}?i=${code}`
}

export function mensajeInvitacion({ invitacion, couple, link }) {
  const limite = fechaLimite(couple.wedding_date, couple.rsvp_deadline_days)
  const fecha = couple.wedding_date
    ? new Date(couple.wedding_date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
    : null
  const lugares = invitacion.passes === 1 ? '1 lugar' : `${invitacion.passes} lugares`
  return [
    `¡Hola ${invitacion.name}! 💍`,
    `${couple.bride_name} y ${couple.groom_name} nos casamos${fecha ? ` el ${fecha}` : ''} y queremos celebrarlo contigo.`,
    `Hemos reservado ${lugares} para ustedes.`,
    '',
    `Confirma tu asistencia${limite ? ` hasta el ${fechaLarga(limite)}` : ''} y mira nuestra lista de regalos aquí:`,
    link,
  ].join('\n')
}

export function linkWhatsAppA(telefono, texto) {
  const digitos = String(telefono || '').replace(/\D/g, '')
  const numero = digitos.length === 9 ? `51${digitos}` : digitos
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`
}

export const PLAZOS = [
  { dias: 90, label: '3 meses antes' },
  { dias: 60, label: '2 meses antes' },
  { dias: 45, label: '45 días antes' },
  { dias: 30, label: '30 días antes' },
  { dias: 15, label: '15 días antes' },
]

// Fecha límite para confirmar = fecha de la boda − días elegidos por los novios.
export function fechaLimite(weddingDate, dias) {
  if (!weddingDate) return null
  const d = new Date(weddingDate + 'T00:00:00')
  d.setDate(d.getDate() - (dias || 30))
  return d
}

export function fechaLarga(d) {
  if (!d) return ''
  const fecha = typeof d === 'string' ? new Date(d.length === 10 ? d + 'T00:00:00' : d) : d
  return fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function mensajeRecordatorio({ invitacion, couple, link, limite }) {
  return [
    `¡Hola ${invitacion.name}! 😊`,
    `Te recordamos que ${couple.bride_name} y ${couple.groom_name} esperan tu confirmación${limite ? ` hasta el ${fechaLarga(limite)}` : ''}.`,
    `Tienes ${invitacion.passes === 1 ? '1 lugar reservado' : `${invitacion.passes} lugares reservados`}. Confirma aquí:`,
    link,
  ].join('\n')
}

export function mensajeAgradecimiento({ nombre, regalo, couple }) {
  return [
    `¡Hola ${nombre}! 💛`,
    `Muchas gracias por tu regalo${regalo ? ` (${regalo})` : ''}. Significa mucho para nosotros.`,
    `Con cariño, ${couple.bride_name} y ${couple.groom_name}.`,
  ].join('\n')
}
