'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname() || ''
  if (pathname.startsWith('/admin')) return null
  return (
    <footer className="border-t border-arena-200 bg-arena/60 px-6 py-12 text-center">
      <p className="font-script text-3xl text-rosa-600">Cherry Bloom Studio</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-cacao-500">Novios · Lima, Perú</p>
      <p className="mt-6 text-xs text-cacao-500">
        © {new Date().getFullYear()} Cherry Bloom Studio — parte de{' '}
        <a href="https://cherry-bloom-studio-web-omega.vercel.app" className="underline hover:text-terracota">
          Cherry Bloom Studio
        </a>
        {' · '}
        <a href="/privacidad" className="underline hover:text-terracota">
          Política de privacidad
        </a>
      </p>
    </footer>
  )
}
