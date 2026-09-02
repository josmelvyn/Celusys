'use client'

import { useAuth } from '@/app/component/providers/auth-provider'
import { logoutAction } from '@/app/lib/auth/actions'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700/60 px-6 flex items-center justify-between text-white">
      <div className="text-sm font-medium text-slate-400">
        Panel de Control
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
          <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </div>
    </header>
  )
}