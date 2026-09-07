import { getDashboardData } from '@/app/lib/dashboard/queries'
import { MetricCard } from '@/app/component/dashboard/metric-card'
import {
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
  Wrench,
  Users,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Resumen operativo y estado general de la tienda
        </p>
      </div>

      {/* Tarjetas de Métricas Principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas del Día"
          value={`RD$ ${data.todaySalesAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
          subtitle={`${data.todaySalesCount} transacciones hoy`}
          icon={DollarSign}
          colorClass="text-emerald-400 bg-emerald-500/10"
        />
        <MetricCard
          title="Reparaciones Pendientes"
          value={data.pendingRepairs}
          subtitle="A la espera de atención"
          icon={Clock}
          colorClass="text-amber-400 bg-amber-500/10"
        />
        <MetricCard
          title="En Reparación"
          value={data.inProgressRepairs}
          subtitle="En proceso por el técnico"
          icon={Wrench}
          colorClass="text-blue-400 bg-blue-500/10"
        />
        <MetricCard
          title="Total Clientes"
          value={data.totalCustomers}
          subtitle="Registrados en el sistema"
          icon={Users}
          colorClass="text-purple-400 bg-purple-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Alertas: Stock Bajo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Stock Bajo
            </h2>
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-medium">
              {data.lowStockProducts.length} Alertas
            </span>
          </div>

          <div className="space-y-3">
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Todo el inventario está en niveles óptimos.
              </p>
            ) : (
              data.lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{prod.name}</p>
                    <p className="text-xs text-slate-500">SKU: {prod.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                      {prod.stock} / min {prod.minStock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tablas Resumen: Últimas Ventas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            Últimas Ventas
          </h2>

          <div className="space-y-3">
            {data.recentSales.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No hay ventas recientes registradas.
              </p>
            ) : (
              data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Venta #{sale.saleNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sale.customer.firstName} {sale.customer.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      RD$ {Number(sale.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">{sale.paymentMethod}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tablas Resumen: Últimas Reparaciones */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-400" />
            Últimas Reparaciones
          </h2>

          <div className="space-y-3">
            {data.recentRepairs.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No hay ordenes de reparación registradas.
              </p>
            ) : (
              data.recentRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Orden #{repair.orderNumber} — {repair.deviceBrand} {repair.deviceModel}
                    </p>
                    <p className="text-xs text-slate-500">
                      {repair.customer.firstName} {repair.customer.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {repair.status}
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