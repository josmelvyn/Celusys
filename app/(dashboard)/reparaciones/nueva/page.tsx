import { prisma } from '@/app/lib/prisma'
import { createRepairAction } from '@/app/lib/reparaciones/actions/repairs'
import Link from 'next/link'
import { ArrowLeft, Wrench } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NuevaReparacionPage() {
  const [customers, technicians] = await Promise.all([
    prisma.customer.findMany({
      where: { active: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
  ])

  if (customers.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <p className="text-slate-300">No hay clientes activos para asignar la orden.</p>
        <Link href="/clientes" className="text-blue-400 hover:underline text-sm">
          Registrar un cliente primero
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/reparaciones"
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nueva Orden de Reparación</h1>
          <p className="text-sm text-slate-400">Recepción de equipo en el taller</p>
        </div>
      </div>

      <form
        action={async (formData: FormData) => {
          'use server'
          await createRepairAction(formData)
        }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Cliente y equipo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" /> Cliente y Equipo
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cliente *</label>
            <select
              name="customerId"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Marca *</label>
              <input
                type="text"
                name="deviceBrand"
                required
                placeholder="Samsung"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Modelo *</label>
              <input
                type="text"
                name="deviceModel"
                required
                placeholder="Galaxy A54"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">IMEI / Serial</label>
            <input
              type="text"
              name="imei"
              placeholder="356938035643809"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Problema reportado por el cliente *
            </label>
            <textarea
              name="reportedProblem"
              required
              rows={4}
              placeholder="El equipo no enciende, pantalla partida..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        {/* Detalles del servicio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
          <h2 className="text-lg font-semibold text-white">Detalles del Servicio</h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Costo estimado (RD$) *
            </label>
            <input
              type="number"
              name="estimatedCost"
              step="0.01"
              min="0"
              defaultValue="0.00"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Técnico asignado</label>
            <select
              name="technicianId"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            >
              <option value="">Sin asignar</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Fecha estimada de entrega</label>
            <input
              type="date"
              name="estimatedAt"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notas internas</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Equipo entra con funda y chip. Sin cargador."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2"
          >
            Crear Orden
          </button>
        </div>
      </form>
    </div>
  )
}
