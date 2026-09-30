'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="w-full rounded-xl px-3 py-2 text-sm font-medium text-cacao-500 hover:bg-arena hover:text-cacao">
      Cerrar sesión
    </button>
  )
}
