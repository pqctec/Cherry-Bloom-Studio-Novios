import { NextResponse } from 'next/server'

// Mantiene despierta la base de datos de Supabase.
// El plan gratuito pausa el proyecto si pasa ~7 días sin actividad; Vercel
// llama a esta ruta una vez al día (ver vercel.json) y hace una consulta
// mínima, así el proyecto nunca queda inactivo.
//
// Opcional: si defines CRON_SECRET en Vercel, solo Vercel podrá llamarla.

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const secreto = process.env.CRON_SECRET
  if (secreto && request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const inicio = Date.now()
  try {
    const r = await fetch(`${url}/rest/v1/decor_services?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    return NextResponse.json(
      { ok: r.ok, estado: r.status, ms: Date.now() - inicio, fecha: new Date().toISOString() },
      { status: r.ok ? 200 : 502 }
    )
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 })
  }
}
