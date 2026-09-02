'use server'

import { prisma } from '@/app/lib/prisma'
import { getSession } from '@/app/lib/auth/session'
import { InventoryMovementType } from '@/app/generated/prisma/client'
import { revalidatePath } from 'next/cache'

export async function createInventoryMovementAction(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Sesión no válida.' }

  const productId = formData.get('productId') as string
  const type = formData.get('type') as InventoryMovementType
  const quantity = parseInt(formData.get('quantity') as string)
  const reason = formData.get('reason') as string

  if (!productId || !type || isNaN(quantity) || quantity <= 0 || !reason) {
    return { error: 'Todos los campos son requeridos y la cantidad debe ser mayor a 0.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw new Error('Producto no encontrado.')

      let newStock = product.stock

      if (type === 'ENTRADA') {
        newStock += quantity
      } else if (type === 'SALIDA') {
        if (product.stock < quantity) {
          throw new Error(`Stock insuficiente. Disponible: ${product.stock}`)
        }
        newStock -= quantity
      } else if (type === 'AJUSTE') {
        // En ajuste la cantidad representa el delta o ajuste positivo/negativo directo
        newStock = quantity
      }

      // Actualizar el stock del producto
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      })

      // Registrar la trazabilidad del movimiento
      await tx.inventoryMovement.create({
        data: {
          productId,
          quantity: type === 'AJUSTE' ? Math.abs(newStock - product.stock) : quantity,
          type,
          reason: reason.trim(),
          userId: session.id,
        },
      })
    })

    revalidatePath('/productos')
    revalidatePath('/inventario')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const error = err as Error
    return { error: error.message || 'Error al procesar el movimiento de inventario.' }
  }
}