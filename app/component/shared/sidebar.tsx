'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/component/providers/auth-provider'
import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  Users,
  ShoppingCart,
  Wrench,
  UserCog,
  Smartphone,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/productos', label: 'Productos', icon: Package },
    { href: '/categorias', label: 'Categorías', icon: Tags },
    { href: '/inventario', label: 'Inventario', icon: Boxes },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
    { href: '/reparaciones', label: 'Reparaciones', icon: Wrench },
  ]

  if (user?.role === 'ADMIN') {
    links.push({ href: '/usuarios', label: 'Usuarios', icon: UserCog })
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="p-2 bg-blue-600 rounded-xl text-white">
            <Smartphone className="w-9 h-9" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-wide">CeluSys</h2>
            <p className="text-xs text-slate-500">v1.0.0</p>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}