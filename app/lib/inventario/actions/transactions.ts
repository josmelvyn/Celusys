'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createInventoryMovementAction(data: {
    productId: string;
    quantity: number;
    type: 'ENTRADA' | 'SALIDA';
    reason: string;
    userId: string;
}) {
    try {
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: data.productId } })
            if (!product) throw new Error('Producto no encontrado')
            
            let stockUpdate = data.type === 'ENTRADA' ? data.quantity : -data.quantity
            
            await tx.product.update({
                where: { id: data.productId },
                data: { stock: { increment: stockUpdate } }
            })
            
            await tx.inventoryMovement.create({
                data: {
                    productId: data.productId,
                    quantity: data.quantity,
                    type: data.type,
                    reason: data.reason,
                    userId: data.userId
                }
            })
        })
        
        revalidatePath('/inventario')
        revalidatePath('/productos')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Error al registrar el movimiento de inventario.' }
    }
}
