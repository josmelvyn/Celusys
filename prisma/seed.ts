import { PrismaClient, Role, ProductType } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando la siembra de datos (seeding)...')

  // 1. Limpieza opcional de datos previos
  await prisma.repairPart.deleteMany()
  await prisma.repairStatusHistory.deleteMany()
  await prisma.repair.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.inventoryMovement.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  // 2. Usuarios Iniciales (Contraseñas encriptadas con bcrypt)
  const hashedPasswordAdmin = await bcrypt.hash('Admin123!', 10)
  const hashedPasswordEmp = await bcrypt.hash('Empleado123!', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador Principal',
      email: 'admin@celusys.com',
      password: hashedPasswordAdmin,
      role: Role.ADMIN,
    },
  })

  const empleado = await prisma.user.create({
    data: {
      name: 'Juan Pérez (Técnico / Ventas)',
      email: 'empleado@celusys.com',
      password: hashedPasswordEmp,
      role: Role.EMPLEADO,
    },
  })

  console.log('✅ Usuarios creados: admin@celusys.com y empleado@celusys.com')

  // 3. Categorías
  const catSmartphones = await prisma.category.create({
    data: { name: 'Smartphones', description: 'Dispositivos móviles Android e iOS' },
  })

  const catAccesorios = await prisma.category.create({
    data: { name: 'Accesorios', description: 'Fundas, micas y protectores' },
  })

  const catCargadores = await prisma.category.create({
    data: { name: 'Cargadores y Cables', description: 'Adaptadores de pared, cables USB-C y Lightning' },
  })

  const catRepuestos = await prisma.category.create({
    data: { name: 'Repuestos', description: 'Pantallas, baterías y puertos de carga' },
  })

  console.log('✅ Categorías creadas')

  // 4. Productos de Prueba
  const p1 = await prisma.product.create({
    data: {
      sku: 'CEL-SAM-A15',
      name: 'Samsung Galaxy A15 128GB',
      brand: 'Samsung',
      type: ProductType.CELULAR,
      model: 'SM-A155M',
      imei: '358941098234111',
      costPrice: 120.00,
      salePrice: 175.00,
      stock: 5,
      minStock: 2,
      categoryId: catSmartphones.id,
    },
  })

  const p2 = await prisma.product.create({
    data: {
      sku: 'ACC-CAR-20W',
      name: 'Cargador Carga Rápida 20W USB-C',
      brand: 'Generic',
      type: ProductType.ACCESORIO,
      costPrice: 5.00,
      salePrice: 15.00,
      stock: 20,
      minStock: 5,
      categoryId: catCargadores.id,
    },
  })

  const p3 = await prisma.product.create({
    data: {
      sku: 'REP-PAN-IP11',
      name: 'Pantalla Incell para iPhone 11',
      brand: 'Apple Replacement',
      type: ProductType.REPUESTO,
      costPrice: 25.00,
      salePrice: 55.00,
      stock: 3,
      minStock: 1,
      categoryId: catRepuestos.id,
    },
  })

  console.log('✅ Productos iniciales creados')

  // 5. Clientes
  const customer1 = await prisma.customer.create({
    data: {
      firstName: 'Carlos',
      lastName: 'Mendoza',
      phone: '8095551234',
      email: 'carlos.mendoza@email.com',
      address: 'Calle Principal #45, San Francisco',
    },
  })

  console.log('✅ Cliente inicial creado')
  console.log('🎉 Seeding finalizado con éxito.')
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })