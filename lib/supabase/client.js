'use client'

import { createBrowserClient } from '@supabase/ssr'

// Cliente de Supabase para usar en componentes de cliente ('use client'):
// formularios, botones, lo que corre en el navegador del novio/invitado.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
