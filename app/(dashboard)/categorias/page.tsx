import { prisma } from '@/app/lib/prisma'
import { createCategoryAction, toggleCategoryStatusAction } from '@/app/lib/categorias/actions/categories'
import { Tags, Plus, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Categorías</h1>
        <p className="text-sm text-slate-400">Administra las familias de productos de la tienda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Creación */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" /> Nueva Categoría
          </h2>

          <form
            action={async (formData: FormData) => {
              'use server'
              await createCategoryAction(formData)
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ej. Fundas y Protectores"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Descripción opcional..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Guardar Categoría
            </button>
          </form>
        </div>

        {/* Tabla de Categorías */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">Descripción</th>
                  <th className="pb-3 font-medium text-center">Productos</th>
                  <th className="pb-3 font-medium text-center">Estado</th>
                  <th className="pb-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-medium text-white">{cat.name}</td>
                    <td className="py-3 text-slate-400 max-w-xs truncate">{cat.description || '—'}</td>
                    <td className="py-3 text-center text-slate-300 font-semibold">{cat._count.products}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cat.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {cat.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <form
                        action={async () => {
                          'use server'
                          await toggleCategoryStatusAction(cat.id, cat.active)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-slate-400 hover:text-white underline"
                        >
                          {cat.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}