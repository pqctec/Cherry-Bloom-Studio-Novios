import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente de Supabase para usar en Server Components / Route Handlers,
// leyendo la sesión desde las cookies de la petición. Es lo que permite
// que /panel sepa quién inició sesión sin depender solo de un chequeo en
// el navegador (que cualquiera podría saltarse).
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Llamado desde un Server Component sin permiso de escritura;
            // el middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  )
}
