import { prisma } from '@/app/lib/prisma'
import VentasForm from './VentasForm'

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
  const [customers, rawProducts, firstUser] = await Promise.all([
    prisma.customer.findMany({ where: { active: true } }),
    prisma.product.findMany({ where: { active: true, stock: { gt: 0 } } }),
    prisma.user.findFirst(),
  ])

  const products = rawProducts.map(p => ({
    ...p,
    costPrice: p.costPrice.toNumber(),
    salePrice: p.salePrice.toNumber(),
  }))

  if (!firstUser) return <div>No hay usuarios registrados</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Nueva Venta</h1>
        <p className="text-sm text-slate-400">Registrar una nueva transacción de venta</p>
      </div>

      <VentasForm customers={customers} products={products} userId={firstUser.id} />
    </div>
  )
}
