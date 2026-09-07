import { prisma } from '@/app/lib/prisma'
import { createInventoryMovementAction } from '@/app/lib/inventario/actions/transactions'
import { ArrowLeftRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TransaccionesInventarioPage() {
  const [products, movements, firstUser] = await Promise.all([
    prisma.product.findMany({ where: { active: true } }),
    prisma.inventoryMovement.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.user.findFirst(),
  ])

  if (!firstUser) return <div>No hay usuarios registrados</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Transacciones de Inventario</h1>
        <p className="text-sm text-slate-400">Registrar entradas y salidas de productos</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <ArrowLeftRight className="w-5 h-5 text-blue-500" /> Nueva Transacción
        </h2>
        <form
          action={async (formData) => {
            'use server'
            await createInventoryMovementAction({
                productId: formData.get('productId') as string,
                quantity: parseInt(formData.get('quantity') as string),
                type: formData.get('type') as 'ENTRADA' | 'SALIDA',
                reason: formData.get('reason') as string,
                userId: firstUser.id
            })
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Producto</label>
            <select name="productId" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white">
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cantidad</label>
            <input type="number" name="quantity" required min="1" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
            <select name="type" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white">
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Motivo</label>
            <input type="text" name="reason" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
          </div>
          <div className="md:col-span-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-xl transition-colors text-sm">
                Registrar Movimiento
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Movimientos Recientes</h2>
        <table className="w-full text-left text-sm text-white">
            <thead>
                <tr className="text-slate-400">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2">Cantidad</th>
                    <th className="pb-2">Tipo</th>
                    <th className="pb-2">Motivo</th>
                    <th className="pb-2">Fecha</th>
                </tr>
            </thead>
            <tbody>
                {movements.map(m => (
                    <tr key={m.id} className="border-t border-slate-800">
                        <td className="py-2">{m.product.name}</td>
                        <td className="py-2">{m.quantity}</td>
                        <td className="py-2">{m.type}</td>
                        <td className="py-2">{m.reason}</td>
                        <td className="py-2">{m.createdAt.toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  )
}
