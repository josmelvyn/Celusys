import { prisma } from '@/app/lib/prisma'

export async function getDashboardData() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    totalProducts,
    lowStockProducts,
    todaySales,
    pendingRepairs,
    inProgressRepairs,
    totalCustomers,
    recentSales,
    recentRepairs,
  ] = await Promise.all([
    // Total de productos activos
    prisma.product.count({ where: { active: true } }),

    // Productos con stock por debajo o igual al stock mínimo
    prisma.product.findMany({
      where: {
        active: true,
        stock: { lte: prisma.product.fields.minStock },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        minStock: true,
      },
      take: 5,
    }),

    // Ventas del día actual
    prisma.sale.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: 'COMPLETADA',
      },
    }),

    // Reparaciones pendientes (RECIBIDO, ESPERANDO_REPUESTO)
    prisma.repair.count({
      where: { status: { in: ['RECIBIDO', 'ESPERANDO_REPUESTO'] } },
    }),

    // Reparaciones en proceso (DIAGNOSTICO, EN_REPARACION)
    prisma.repair.count({
      where: { status: { in: ['DIAGNOSTICO', 'EN_REPARACION'] } },
    }),

    // Total de clientes registrados
    prisma.customer.count({ where: { active: true } }),

    // Últimas 5 ventas
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    }),

    // Últimas 5 ordenes de reparación
    prisma.repair.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
  ])

  return {
    totalProducts,
    lowStockProducts,
    todaySalesAmount: todaySales._sum.total ? Number(todaySales._sum.total) : 0,
    todaySalesCount: todaySales._count.id,
    pendingRepairs,
    inProgressRepairs,
    totalCustomers,
    recentSales,
    recentRepairs,
  }
}