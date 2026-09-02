'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/lib/auth/actions'
import { Smartphone, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-500 mb-2">
            <Smartphone className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CeluSys</h1>
          <p className="text-slate-400 text-sm">Gestión de Tienda y Taller de Celulares</p>
        </div>

        {state?.error && (
          <div className="flex items-center gap-3 p-4 text-sm text-red-400 bg-red-950/50 border border-red-800/50 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="usuario@celusys.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        <div className="border-t border-slate-700/60 pt-4 text-xs text-center text-slate-500">
          CeluSys v1.0 — Proyecto Programacion 1 UAPA 
        </div>
        
        <div className="border-t border-slate-700/60 pt-10 text-xs text-center text-slate-1000">
        <h2><strong>DEMO</strong></h2>
        <address className='block text-sm font-medium text-slate-300 mb-1.5'>
          correo: admin@celusys.com <br />
          password: Admin123!
        </address>
        </div>

      </div>
    </div>
  )
}