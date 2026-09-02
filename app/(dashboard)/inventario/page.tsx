import { prisma } from '@/app/lib/prisma'
import { createInventoryMovementAction } from '@/app/lib/inventario/actions/inventory'
import { Boxes, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
  const handleInventoryMovementSubmit = async (formData: FormData) => {
    'use server'
    await createInventoryMovementAction(formData)
  }

  const [movements, products] = await Promise.all([
    prisma.inventoryMovement.findMany({
      include: {
        product: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Kardex de Inventario</h1>
        <p className="text-sm text-slate-400">Trazabilidad de entradas, salidas y ajustes de stock</p>
      </div>

      {/* Formulario para Registrar Movimiento */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Boxes className="w-5 h-5 text-blue-500" /> Registrar Movimiento Manual
        </h2>

        <form action={handleInventoryMovementSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Producto *</label>
            <select
              name="productId"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Movimiento *</label>
            <select
              name="type"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            >
              <option value="ENTRADA">ENTRADA (+ Stock)</option>
              <option value="SALIDA">SALIDA (- Stock)</option>
              <option value="AJUSTE">AJUSTE (Fijar Stock Exacto)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cantidad / Nuevo Stock *</label>
            <input
              type="number"
              name="quantity"
              required
              min={1}
              placeholder="1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Motivo / Justificación *</label>
            <input
              type="text"
              name="reason"
              required
              placeholder="Ej. Compra a proveedor #104"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="md:col-span-4 text-right">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2 rounded-xl transition-colors text-sm"
            >
              Aplicar Movimiento
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
        <h2 className="text-base font-semibold text-white mb-4">Historial Reciente de Movimientos</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-medium">Fecha</th>
              <th className="pb-3 font-medium">Producto</th>
              <th className="pb-3 font-medium text-center">Tipo</th>
              <th className="pb-3 font-medium text-center">Cantidad</th>
              <th className="pb-3 font-medium">Motivo</th>
              <th className="pb-3 font-medium text-right">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/30">
                <td className="py-3 text-xs text-slate-400">
                  {new Date(m.createdAt).toLocaleString('es-DO')}
                </td>
                <td className="py-3 font-semibold text-white">{m.product.name}</td>
                <td className="py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                      m.type === 'ENTRADA'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : m.type === 'SALIDA'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {m.type}
                  </span>
                </td>
                <td className="py-3 text-center font-bold text-white">{m.quantity}</td>
                <td className="py-3 text-slate-300">{m.reason}</td>
                <td className="py-3 text-right text-xs text-slate-400">{m.user.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}