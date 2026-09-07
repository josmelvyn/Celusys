import { prisma } from '@/app/lib/prisma'
import { Prisma, RepairStatus } from '@/app/generated/prisma/client'
import {
  REPAIR_STATUSES,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_STYLES,
} from '@/app/lib/reparaciones/status'
import Link from 'next/link'
import { Wrench, Plus, Eye, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 10

export default async function ReparacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const status = REPAIR_STATUSES.includes(params.status as RepairStatus)
    ? (params.status as RepairStatus)
    : ''
  const currentPage = Math.max(1, Number(params.page) || 1)

  const filters: Prisma.RepairWhereInput[] = []

  if (status) filters.push({ status })

  if (query) {
    const orderNumber = Number(query)
    filters.push({
      OR: [
        { deviceBrand: { contains: query, mode: 'insensitive' } },
        { deviceModel: { contains: query, mode: 'insensitive' } },
        { imei: { contains: query, mode: 'insensitive' } },
        { customer: { firstName: { contains: query, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query, mode: 'insensitive' } } },
        { customer: { phone: { contains: query, mode: 'insensitive' } } },
        ...(Number.isInteger(orderNumber) ? [{ orderNumber }] : []),
      ],
    })
  }

  const where: Prisma.RepairWhereInput = filters.length ? { AND: filters } : {}

  const [repairs, totalRepairs, statusCounts] = await Promise.all([
    prisma.repair.findMany({
      where,
      include: { customer: true, technician: true },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.repair.count({ where }),
    prisma.repair.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s._count._all]))
  const totalPages = Math.max(1, Math.ceil(totalRepairs / PAGE_SIZE))
  const extraParams = `${query ? `&q=${encodeURIComponent(query)}` : ''}${
    status ? `&status=${status}` : ''
  }`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reparaciones</h1>
          <p className="text-sm text-slate-400">Órdenes de servicio del taller</p>
        </div>
        <Link
          href="/reparaciones/nueva"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Orden
        </Link>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/reparaciones"
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            status
              ? 'border-slate-800 text-slate-400 hover:bg-slate-800/60'
              : 'bg-blue-600 border-blue-600 text-white'
          }`}
        >
          Todas
        </Link>
        {REPAIR_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/reparaciones?status=${s}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              status === s
                ? 'bg-blue-600 border-blue-600 text-white'
                : `${REPAIR_STATUS_STYLES[s]} hover:brightness-125`
            }`}
          >
            {REPAIR_STATUS_LABELS[s]} ({countByStatus.get(s) ?? 0})
          </Link>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <form method="GET" className="relative">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por # de orden, cliente, marca, modelo o IMEI..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium">Orden</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Equipo</th>
                <th className="pb-3 font-medium">Técnico</th>
                <th className="pb-3 font-medium text-center">Estado</th>
                <th className="pb-3 font-medium text-right">Costo</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {repairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No hay órdenes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                repairs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-3">
                      <p className="font-bold text-white">#{r.orderNumber}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(r.receivedAt).toLocaleDateString('es-DO')}
                      </p>
                    </td>
                    <td className="py-3 text-slate-200">
                      {r.customer.firstName} {r.customer.lastName}
                      <p className="text-xs text-slate-500">{r.customer.phone}</p>
                    </td>
                    <td className="py-3 text-slate-300">
                      {r.deviceBrand} {r.deviceModel}
                      <p className="text-xs text-slate-500 truncate max-w-[220px]">
                        {r.reportedProblem}
                      </p>
                    </td>
                    <td className="py-3 text-xs text-slate-400">
                      {r.technician?.name || 'Sin asignar'}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border ${
                          REPAIR_STATUS_STYLES[r.status]
                        }`}
                      >
                        {REPAIR_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-white">
                      RD$ {Number(r.finalCost ?? r.estimatedCost).toLocaleString('es-DO', {
                        minimumFractionDigits: 2,
                      })}
                      {r.finalCost === null && (
                        <p className="text-[10px] font-normal text-slate-500">estimado</p>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/reparaciones/${r.id}`}
                        className="inline-block p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Ver orden"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800 text-sm text-slate-400">
          <span>
            Página {currentPage} de {totalPages} ({totalRepairs} órdenes)
          </span>
          <div className="flex gap-2">
            <Link
              href={`/reparaciones?page=${currentPage - 1}${extraParams}`}
              aria-disabled={currentPage <= 1}
              className={`px-3 py-1.5 rounded-lg border border-slate-800 ${
                currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-800/60 text-white'
              }`}
            >
              Anterior
            </Link>
            <Link
              href={`/reparaciones?page=${currentPage + 1}${extraParams}`}
              aria-disabled={currentPage >= totalPages}
              className={`px-3 py-1.5 rounded-lg border border-slate-800 ${
                currentPage >= totalPages
                  ? 'pointer-events-none opacity-40'
                  : 'hover:bg-slate-800/60 text-white'
              }`}
            >
              Siguiente
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
