'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/Icon'

const NAV = [
  { href: '/panel', label: 'Resumen', icon: 'heart' },
  { href: '/panel/invitados', label: 'Invitaciones', icon: 'users' },
  { href: '/panel/regalos', label: 'Lista de regalos', icon: 'gift' },
  { href: '/panel/decoracion', label: 'Decoración', icon: 'flower' },
  { href: '/panel/configuracion', label: 'Nuestra página', icon: 'rings' },
]

export default function PanelNav({ slug, nuevas = 0 }) {
  const pathname = usePathname()

  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto text-left lg:flex-col">
      {NAV.map((item) => {
        const activo = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              activo ? 'bg-rubor-100 text-terracota-800' : 'text-cacao-700 hover:bg-arena'
            }`}
          >
            <Icon name={item.icon} className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.href === '/panel' && nuevas > 0 && (
              <span className="rounded-full bg-terracota px-2 py-0.5 text-[10px] font-semibold text-white">{nuevas}</span>
            )}
          </Link>
        )
      })}
      <a
        href={`/boda/${slug}`}
        target="_blank"
        className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rosa-600 hover:bg-arena"
      >
        <Icon name="link" className="h-4 w-4" />
        Ver nuestra página
      </a>
    </nav>
  )
}
