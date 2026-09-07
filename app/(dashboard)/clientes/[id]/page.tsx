import { prisma } from '@/app/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, Mail, MapPin, ShoppingBag, Wrench, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      },
      repairs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) {
    notFound()
  }

  const totalSpent = customer.sales.reduce((acc, s) => acc + Number(s.total), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/clientes"
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-sm text-slate-400">Perfil de cliente e historial unificado</p>
        </div>
      </div>

      {/* Tarjeta con Información General */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Teléfono</p>
            <p className="text-sm font-semibold text-white">{customer.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Correo Electrónico</p>
            <p className="text-sm font-semibold text-white">{customer.email || 'No registrado'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Dirección</p>
            <p className="text-sm font-semibold text-white truncate max-w-[300px]">
              {customer.address || 'No registrada'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Comprado</p>
            <p className="text-base font-bold text-emerald-400">
              RD$ {totalSpent.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Secciones de Historiales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historial de Compras */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" /> Historial de Compras ({customer.sales.length})
          </h2>

          <div className="space-y-3">
            {customer.sales.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Este cliente no ha realizado compras.</p>
            ) : (
              customer.sales.map((sale) => (
                <div key={sale.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-white">Venta #{sale.saleNumber}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(sale.createdAt).toLocaleDateString('es-DO')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    {sale.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-slate-300">RD$ {Number(item.subtotal).toLocaleString('es-DO')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                    <span className="text-xs text-slate-500 uppercase font-semibold">{sale.paymentMethod}</span>
                    <span className="font-bold text-emerald-400">
                      RD$ {Number(sale.total).toLocaleString('es-DO')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Historial de Reparaciones */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-400" /> Órdenes de Reparación ({customer.repairs.length})
          </h2>

          <div className="space-y-3">
            {customer.repairs.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Este cliente no posee reparaciones.</p>
            ) : (
              customer.repairs.map((repair) => (
                <div key={repair.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-white">
                      Orden #{repair.orderNumber} — {repair.deviceBrand} {repair.deviceModel}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {repair.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Problema:</strong> {repair.reportedProblem}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>Recibido: {new Date(repair.receivedAt).toLocaleDateString('es-DO')}</span>
                    <span className="font-bold text-white">
                      Costo: RD$ {Number(repair.finalCost || repair.estimatedCost).toLocaleString('es-DO')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}