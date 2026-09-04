import { prisma } from '@/app/lib/prisma'
import { createCustomerAction, toggleCustomerStatusAction } from '@/app/lib/clientes/actions/customers'
import Link from 'next/link'
import { Users, UserPlus, Eye, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 10

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const currentPage = Math.max(1, Number(params.page) || 1)

  const where = query
    ? {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [customers, totalCustomers] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { sales: true, repairs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCustomers / PAGE_SIZE))
  const queryParam = query ? `&q=${encodeURIComponent(query)}` : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Clientes</h1>
        <p className="text-sm text-slate-400">Directorio de compradores y usuarios del taller</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Registro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" /> Registrar Cliente
          </h2>

          <form
            action={async (formData: FormData) => {
              'use server'
              await createCustomerAction(formData)
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre *</label>
              <input
                type="text"
                name="firstName"
                required
                placeholder="Juan"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Apellido *</label>
              <input
                type="text"
                name="lastName"
                required
                placeholder="Pérez"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono *</label>
              <input
                type="text"
                name="phone"
                required
                placeholder="809-555-0000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                placeholder="correo@ejemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dirección</label>
              <input
                type="text"
                name="address"
                placeholder="Calle, Sector, Ciudad"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2"
            >
              Guardar Cliente
            </button>
          </form>
        </div>

        {/* Listado de Clientes con Buscador */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <form method="GET" className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por nombre, teléfono o correo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Contacto</th>
                  <th className="pb-3 font-medium text-center">Ventas</th>
                  <th className="pb-3 font-medium text-center">Reparaciones</th>
                  <th className="pb-3 font-medium text-center">Estado</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-white">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="py-3 text-xs text-slate-300">
                      <p className="font-medium text-slate-200">{c.phone}</p>
                      <p className="text-slate-500">{c.email || 'Sin correo'}</p>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-300">{c._count.sales}</td>
                    <td className="py-3 text-center font-bold text-indigo-400">{c._count.repairs}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          c.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Ver historial completo"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <form
                          action={async () => {
                            'use server'
                            await toggleCustomerStatusAction(c.id, c.active)
                          }}
                        >
                          <button type="submit" className="text-xs text-slate-400 hover:text-white underline">
                            {c.active ? 'Desactivar' : 'Activar'}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800 text-sm text-slate-400">
            <span>
              Página {currentPage} de {totalPages} ({totalCustomers} clientes)
            </span>
            <div className="flex gap-2">
              <Link
                href={`/clientes?page=${currentPage - 1}${queryParam}`}
                aria-disabled={currentPage <= 1}
                className={`px-3 py-1.5 rounded-lg border border-slate-800 ${
                  currentPage <= 1
                    ? 'pointer-events-none opacity-40'
                    : 'hover:bg-slate-800/60 text-white'
                }`}
              >
                Anterior
              </Link>
              <Link
                href={`/clientes?page=${currentPage + 1}${queryParam}`}
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
    </div>
  )
}