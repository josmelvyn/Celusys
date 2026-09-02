import { prisma } from '@/app/lib/prisma'
import { createProductAction, toggleProductStatusAction } from '@/app/lib/productos/actions/products'
import { Package, Plus, Search, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({ where: { active: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Productos e Inventario</h1>
          <p className="text-sm text-slate-400">Catálogo de celulares, accesorios y repuestos</p>
        </div>
      </div>

      {/* Formulario Rápido de Registro de Producto */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" /> Registrar Nuevo Producto
        </h2>

        <form
          action={async (formData) => {
            'use server'
            await createProductAction(formData)
          }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">SKU *</label>
            <input
              type="text"
              name="sku"
              required
              placeholder="Ej. CEL-SAM-A15"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej. Samsung Galaxy A15"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Marca *</label>
            <input
              type="text"
              name="brand"
              required
              placeholder="Ej. Samsung"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tipo *</label>
            <select
              name="type"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            >
              <option value="CELULAR">CELULAR</option>
              <option value="ACCESORIO">ACCESORIO</option>
              <option value="REPUESTO">REPUESTO</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Categoría *</label>
            <select
              name="categoryId"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Precio Costo (RD$) *</label>
            <input
              type="number"
              step="0.01"
              name="costPrice"
              required
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Precio Venta (RD$) *</label>
            <input
              type="number"
              step="0.01"
              name="salePrice"
              required
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Stock Inicial</label>
            <input
              type="number"
              name="stock"
              defaultValue={0}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Modelo (Opcional)</label>
            <input
              type="text"
              name="model"
              placeholder="Ej. SM-A155M"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">IMEI (Celulares)</label>
            <input
              type="text"
              name="imei"
              placeholder="15 dígitos"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl transition-colors text-sm"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-medium">SKU / Producto</th>
              <th className="pb-3 font-medium">Categoría / Tipo</th>
              <th className="pb-3 font-medium">Costo</th>
              <th className="pb-3 font-medium">Precio Venta</th>
              <th className="pb-3 font-medium text-center">Stock</th>
              <th className="pb-3 font-medium text-center">Estado</th>
              <th className="pb-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {products.map((p) => {
              const isLowStock = p.stock <= p.minStock
              return (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="py-3">
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      SKU: {p.sku} {p.model ? `| Mod: ${p.model}` : ''}
                    </p>
                  </td>
                  <td className="py-3">
                    <p className="text-slate-300">{p.category.name}</p>
                    <span className="text-[10px] font-bold text-blue-400">{p.type}</span>
                  </td>
                  <td className="py-3 text-slate-400">
                    RD$ {Number(p.costPrice).toLocaleString('es-DO')}
                  </td>
                  <td className="py-3 font-bold text-emerald-400">
                    RD$ {Number(p.salePrice).toLocaleString('es-DO')}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        isLowStock
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <form
                      action={async () => {
                        'use server'
                        await toggleProductStatusAction(p.id, p.active)
                      }}
                    >
                      <button type="submit" className="text-xs text-slate-400 hover:text-white underline">
                        {p.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}