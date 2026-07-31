'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  
  const links = [
    { href: '/membre', label: 'Home', icon: '🏠' },
    { href: '/membre/evenements', label: 'Events', icon: '📅' },
    { href: '/membre/projets', label: 'Projets', icon: '🛠️' },
    { href: '/membre/classement', label: 'Rang', icon: '🏆' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-accent/20 bg-bg/90 px-2 backdrop-blur-lg lg:hidden">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/membre' && pathname.startsWith(link.href))
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className={`flex h-12 w-16 flex-col items-center justify-center rounded-md transition-all duration-200 ${
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:bg-card/80 hover:text-text'
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="text-[10px] font-mono mt-0.5">{link.label}</span>
            {isActive ? <span className="mt-0.5 h-0.5 w-4 rounded-full bg-accent" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}