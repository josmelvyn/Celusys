'use server'

import { prisma } from '@/app/lib/prisma'
import { ProductType } from '@/app/generated/prisma/client'
import { revalidatePath } from 'next/cache'

export async function createProductAction(formData: FormData) {
  try {
    const sku = formData.get('sku') as string
    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const type = formData.get('type') as ProductType
    const categoryId = formData.get('categoryId') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const salePrice = parseFloat(formData.get('salePrice') as string)
    const stock = parseInt(formData.get('stock') as string) || 0
    const minStock = parseInt(formData.get('minStock') as string) || 2
    const model = (formData.get('model') as string) || null
    const imei = (formData.get('imei') as string) || null

    // Validaciones
    if (!sku || !name || !brand || !categoryId) {
      return { error: 'Por favor, complete todos los campos obligatorios.' }
    }
    if (isNaN(costPrice) || costPrice < 0 || isNaN(salePrice) || salePrice < 0) {
      return { error: 'Los precios no pueden ser negativos.' }
    }
    if (salePrice < costPrice) {
      return { error: 'El precio de venta no puede ser menor al costo.' }
    }

    // Creación en transacción para registrar el movimiento inicial de stock si stock > 0
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          brand: brand.trim(),
          type,
          categoryId,
          costPrice,
          salePrice,
          stock,
          minStock,
          model: model?.trim() || null,
          imei: imei?.trim() || null,
        },
      })

      if (stock > 0) {
        // Necesitamos el usuario (hardcoded temporal o vía session)
        const firstUser = await tx.user.findFirst()
        if (firstUser) {
          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              quantity: stock,
              type: 'ENTRADA',
              reason: 'Inventario Inicial',
              userId: firstUser.id,
            },
          })
        }
      }
    })

    revalidatePath('/productos')
    revalidatePath('/inventario')
    return { success: true }
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return { error: 'El SKU o IMEI ingresado ya está registrado en el sistema.' }
    }
    return { error: 'Error interno al guardar el producto.' }
  }
}

export async function toggleProductStatusAction(id: string, active: boolean) {
  try {
    await prisma.product.update({
      where: { id },
      data: { active: !active },
    })
    revalidatePath('/productos')
    return { success: true }
  } catch {
    return { error: 'No se pudo actualizar el estado del producto.' }
  }
}