import { prisma } from '@/app/lib/prisma'
import {
  updateRepairStatusAction,
  updateRepairDetailsAction,
  addRepairPartAction,
  confirmRepairPartAction,
  removeRepairPartAction,
} from '@/app/lib/reparaciones/actions/repairs'
import {
  REPAIR_STATUSES,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_STYLES,
  isClosed,
} from '@/app/lib/reparaciones/status'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Smartphone,
  User,
  Wrench,
  History,
  Package,
  Trash2,
  Check,
  Plus,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const money = (value: number) =>
  `RD$ ${value.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`

export default async function ReparacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [repair, technicians, spareParts] = await Promise.all([
    prisma.repair.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: true,
        usedParts: { include: { product: true }, orderBy: { createdAt: 'asc' } },
        statusHistory: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where: { active: true, type: 'REPUESTO' },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!repair) notFound()

  const closed = isClosed(repair.status)
  const partsTotal = repair.usedParts.reduce((acc, p) => acc + Number(p.subtotal), 0)
  const estimatedCost = Number(repair.estimatedCost)
  const totalToCharge = repair.finalCost !== null ? Number(repair.finalCost) : estimatedCost + partsTotal

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/reparaciones"
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Orden #{repair.orderNumber}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border ${REPAIR_STATUS_STYLES[repair.status]}`}
            >
              {REPAIR_STATUS_LABELS[repair.status]}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Recibido el {new Date(repair.receivedAt).toLocaleDateString('es-DO')}
            {repair.deliveredAt &&
              ` · Entregado el ${new Date(repair.deliveredAt).toLocaleDateString('es-DO')}`}
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Cliente</p>
            <Link
              href={`/clientes/${repair.customerId}`}
              className="text-sm font-semibold text-white hover:text-blue-400 truncate block"
            >
              {repair.customer.firstName} {repair.customer.lastName}
            </Link>
            <p className="text-xs text-slate-500">{repair.customer.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Equipo</p>
            <p className="text-sm font-semibold text-white truncate">
              {repair.deviceBrand} {repair.deviceModel}
            </p>
            <p className="text-xs text-slate-500">IMEI: {repair.imei || 'No registrado'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Técnico</p>
            <p className="text-sm font-semibold text-white truncate">
              {repair.technician?.name || 'Sin asignar'}
            </p>
            <p className="text-xs text-slate-500">
              Entrega estimada:{' '}
              {repair.estimatedAt
                ? new Date(repair.estimatedAt).toLocaleDateString('es-DO')
                : 'No definida'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {repair.finalCost !== null ? 'Costo final' : 'Estimado + repuestos'}
            </p>
            <p className="text-base font-bold text-emerald-400">{money(totalToCharge)}</p>
            <p className="text-xs text-slate-500">
              Mano de obra {money(estimatedCost)} · Repuestos {money(partsTotal)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Problema y diagnóstico */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Diagnóstico y Trabajo</h2>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Problema reportado por el cliente</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{repair.reportedProblem}</p>
            </div>

            <form
              action={async (formData: FormData) => {
                'use server'
                await updateRepairDetailsAction(repair.id, formData)
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Diagnóstico técnico
                </label>
                <textarea
                  name="diagnosis"
                  rows={3}
                  disabled={closed}
                  defaultValue={repair.diagnosis || ''}
                  placeholder="Falla en el conector de carga..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trabajo realizado
                </label>
                <textarea
                  name="workDone"
                  rows={3}
                  disabled={closed}
                  defaultValue={repair.workDone || ''}
                  placeholder="Se reemplazó el pin de carga y se limpió la placa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Técnico</label>
                  <select
                    name="technicianId"
                    disabled={closed}
                    defaultValue={repair.technicianId || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Entrega estimada
                  </label>
                  <input
                    type="date"
                    name="estimatedAt"
                    disabled={closed}
                    defaultValue={
                      repair.estimatedAt
                        ? new Date(repair.estimatedAt).toISOString().slice(0, 10)
                        : ''
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Costo final (RD$)
                  </label>
                  <input
                    type="number"
                    name="finalCost"
                    step="0.01"
                    min="0"
                    disabled={closed}
                    defaultValue={repair.finalCost !== null ? Number(repair.finalCost) : ''}
                    placeholder={String(estimatedCost + partsTotal)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notas internas</label>
                <textarea
                  name="notes"
                  rows={2}
                  disabled={closed}
                  defaultValue={repair.notes || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={closed}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                Guardar cambios
              </button>
            </form>
          </div>

          {/* Repuestos usados */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" /> Repuestos ({repair.usedParts.length})
            </h2>

            {!closed && (
              <form
                action={async (formData: FormData) => {
                  'use server'
                  await addRepairPartAction(repair.id, formData)
                }}
                className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3"
              >
                <select
                  name="productId"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {spareParts.length === 0 ? (
                    <option value="">No hay repuestos registrados</option>
                  ) : (
                    spareParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {money(Number(p.salePrice))} (Stock: {p.stock})
                      </option>
                    ))
                  )}
                </select>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  step="1"
                  defaultValue={1}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
                <button
                  type="submit"
                  disabled={spareParts.length === 0}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl px-4 py-2 text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </form>
            )}

            {repair.usedParts.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Esta orden aún no tiene repuestos asignados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-medium">Repuesto</th>
                      <th className="pb-3 font-medium text-center">Cant.</th>
                      <th className="pb-3 font-medium text-right">Precio</th>
                      <th className="pb-3 font-medium text-right">Subtotal</th>
                      <th className="pb-3 font-medium text-center">Inventario</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {repair.usedParts.map((part) => (
                      <tr key={part.id}>
                        <td className="py-3 text-white">{part.product.name}</td>
                        <td className="py-3 text-center text-slate-300">{part.quantity}</td>
                        <td className="py-3 text-right text-slate-300">
                          {money(Number(part.unitPrice))}
                        </td>
                        <td className="py-3 text-right font-semibold text-white">
                          {money(Number(part.subtotal))}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              part.isConfirmed
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}
                          >
                            {part.isConfirmed ? 'Descontado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-3">
                            {!closed && !part.isConfirmed && (
                              <form
                                action={async () => {
                                  'use server'
                                  await confirmRepairPartAction(part.id)
                                }}
                              >
                                <button
                                  type="submit"
                                  title="Confirmar instalación y descontar del inventario"
                                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </form>
                            )}
                            {!closed && (
                              <form
                                action={async () => {
                                  'use server'
                                  await removeRepairPartAction(part.id)
                                }}
                              >
                                <button
                                  type="submit"
                                  title="Quitar repuesto"
                                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-800">
                      <td colSpan={3} className="pt-3 text-right text-slate-400">
                        Total en repuestos
                      </td>
                      <td className="pt-3 text-right font-bold text-amber-400">{money(partsTotal)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: estado e historial */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Cambiar Estado</h2>

            {closed ? (
              <p className="text-sm text-slate-500">
                La orden está {REPAIR_STATUS_LABELS[repair.status].toLowerCase()} y no admite más
                cambios.
              </p>
            ) : (
              <form
                action={async (formData: FormData) => {
                  'use server'
                  await updateRepairStatusAction(repair.id, formData)
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nuevo estado</label>
                  <select
                    name="status"
                    required
                    defaultValue={repair.status}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {REPAIR_STATUSES.map((s) => (
                      <option key={s} value={s} disabled={s === repair.status}>
                        {REPAIR_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nota del cambio
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Se llamó al cliente para autorizar el repuesto."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Actualizar Estado
                </button>
              </form>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" /> Historial ({repair.statusHistory.length})
            </h2>

            <ol className="space-y-4">
              {repair.statusHistory.map((h) => (
                <li key={h.id} className="relative pl-5 border-l border-slate-800">
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <p className="text-sm text-white">
                    {h.previousStatus
                      ? `${REPAIR_STATUS_LABELS[h.previousStatus]} → ${REPAIR_STATUS_LABELS[h.newStatus]}`
                      : REPAIR_STATUS_LABELS[h.newStatus]}
                  </p>
                  {h.notes && <p className="text-xs text-slate-400 mt-0.5">{h.notes}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {h.user.name} · {new Date(h.createdAt).toLocaleString('es-DO')}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
