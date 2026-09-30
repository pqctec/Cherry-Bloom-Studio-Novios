import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Envía por WhatsApp a los novios los avisos (confirmaciones y regalos) que
// aún no se enviaron. La página del invitado llama a esta ruta después de
// confirmar o regalar. Es segura de llamar varias veces: solo procesa avisos
// pendientes de los últimos 60 minutos y los marca como enviados.
//
// Se activa con estas variables de entorno (en .env.local y en Vercel):
//   SUPABASE_SERVICE_ROLE_KEY   Supabase → Project Settings → API → service_role (¡secreta!)
//   WHATSAPP_TOKEN              token de acceso de la app de Meta (WhatsApp Cloud API)
//   WHATSAPP_PHONE_NUMBER_ID    ID del número de WhatsApp Business que envía
//   WHATSAPP_TEMPLATE           nombre de la plantilla aprobada (por defecto "aviso_boda")
//   WHATSAPP_TEMPLATE_LANG      idioma de la plantilla (por defecto "es")
// Sin estas variables la ruta no hace nada y los avisos quedan solo en el panel.

export async function POST(request) {
  const { SUPABASE_SERVICE_ROLE_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env
  const plantilla = process.env.WHATSAPP_TEMPLATE || 'aviso_boda'
  const idioma = process.env.WHATSAPP_TEMPLATE_LANG || 'es'

  if (!SUPABASE_SERVICE_ROLE_KEY || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return NextResponse.json({ enviado: 0, motivo: 'WhatsApp no configurado' })
  }

  let slug
  try {
    ;({ slug } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }
  if (!slug || typeof slug !== 'string') return NextResponse.json({ error: 'Falta slug' }, { status: 400 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: couple } = await admin.from('couples').select('id, bride_name').eq('slug', slug).maybeSingle()
  if (!couple) return NextResponse.json({ enviado: 0 })

  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: avisos } = await admin
    .from('notifications')
    .select('id, title, body')
    .eq('couple_id', couple.id)
    .is('sent_at', null)
    .is('send_error', null)
    .gte('created_at', desde)
    .order('created_at')
    .limit(10)
  if (!avisos?.length) return NextResponse.json({ enviado: 0 })

  const { data: privado } = await admin.from('couple_private').select('whatsapp, notify_whatsapp').eq('couple_id', couple.id).maybeSingle()
  const digitos = String(privado?.whatsapp || '').replace(/\D/g, '')
  const numero = digitos.length === 9 ? `51${digitos}` : digitos

  if (!numero || privado?.notify_whatsapp === false) {
    await admin
      .from('notifications')
      .update({ send_error: numero ? 'avisos desactivados' : 'sin whatsapp' })
      .in('id', avisos.map((a) => a.id))
    return NextResponse.json({ enviado: 0, motivo: 'Los novios no tienen WhatsApp de avisos' })
  }

  let enviados = 0
  for (const aviso of avisos) {
    const texto = aviso.body ? `${aviso.title} (${aviso.body})` : aviso.title
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numero,
          type: 'template',
          template: {
            name: plantilla,
            language: { code: idioma },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: couple.bride_name },
                  { type: 'text', text: texto.slice(0, 900) },
                ],
              },
            ],
          },
        }),
      })
      if (res.ok) {
        enviados++
        await admin.from('notifications').update({ sent_at: new Date().toISOString() }).eq('id', aviso.id)
      } else {
        const detalle = await res.text()
        await admin.from('notifications').update({ send_error: detalle.slice(0, 300) }).eq('id', aviso.id)
      }
    } catch (e) {
      await admin.from('notifications').update({ send_error: String(e.message || e).slice(0, 300) }).eq('id', aviso.id)
    }
  }

  return NextResponse.json({ enviado: enviados })
}
