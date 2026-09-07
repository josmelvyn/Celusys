'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createSaleAction(data: {
  customerId: string;
  userId: string;
  items: { productId: string; quantity: number; unitPrice: number; subtotal: number; discount: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
}) {
  try {
    await prisma.$transaction(async (tx) => {
        // Create Sale
        const sale = await tx.sale.create({
            data: {
                customerId: data.customerId,
                userId: data.userId,
                subtotal: data.subtotal,
                discount: data.discount,
                tax: data.tax,
                total: data.total,
                paymentMethod: data.paymentMethod,
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        subtotal: item.subtotal
                    }))
                }
            }
        })
        
        // Update stock and create inventory movements
        for (const item of data.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } }
            })
            
            await tx.inventoryMovement.create({
                data: {
                    productId: item.productId,
                    quantity: item.quantity,
                    type: 'SALIDA',
                    reason: `Venta #${sale.saleNumber}`,
                    userId: data.userId
                }
            })
        }
    })
    
    revalidatePath('/ventas')
    revalidatePath('/inventario')
    revalidatePath('/productos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al registrar la venta.' }
  }
}
